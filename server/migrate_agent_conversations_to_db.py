import asyncio
import json
from pathlib import Path

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.agent import Agent
from app.models.agent_conversation import AgentConversation


BASE_DIR = Path(__file__).resolve().parent
CONVERSATIONS_DIR = BASE_DIR / "data" / "agent_conversations"


async def migrate_agent_file(agent_type: str) -> None:
    file_path = CONVERSATIONS_DIR / f"{agent_type}.json"
    if not file_path.exists():
        print(f"No conversation file found for {agent_type}: {file_path}")
        return

    with file_path.open("r", encoding="utf-8") as file:
        loaded = json.load(file)

    entries: list[dict] = []
    if isinstance(loaded, list):
        if loaded and all(isinstance(item, dict) for item in loaded):
            entries = loaded
        elif loaded and all(isinstance(item, str) for item in loaded):
            for index in range(0, len(loaded) - 1, 2):
                entries.append(
                    {
                        "user_input": loaded[index],
                        "output": loaded[index + 1],
                    }
                )

    if not entries:
        print(f"No valid entries to migrate for {agent_type}.")
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Agent).filter(Agent.type == agent_type))
        agent = result.scalars().first()

        if not agent:
            agent = Agent(
                name=f"{agent_type.title()} Agent",
                type=agent_type,
                config={"migrated_from_file": True},
            )
            db.add(agent)
            await db.flush()

        existing_result = await db.execute(
            select(AgentConversation).filter(AgentConversation.agent_id == agent.id)
        )
        existing_rows = existing_result.scalars().all()
        existing_pairs = {(row.user_input, row.output) for row in existing_rows}

        inserted = 0
        for entry in entries:
            user_input = entry.get("user_input")
            output = entry.get("output")
            if not isinstance(user_input, str) or not isinstance(output, str):
                continue
            if (user_input, output) in existing_pairs:
                continue

            db.add(
                AgentConversation(
                    agent_id=agent.id,
                    user_input=user_input,
                    output=output,
                )
            )
            inserted += 1

        await db.commit()
        print(f"Migrated {inserted} conversation entries for agent type '{agent_type}'.")


async def main() -> None:
    await migrate_agent_file("conceptual")
    await migrate_agent_file("logical")


if __name__ == "__main__":
    asyncio.run(main())
