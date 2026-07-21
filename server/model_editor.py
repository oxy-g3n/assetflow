import json
from typing import Any, Dict

from agent_runner import AgentRunner, DEFAULT_AGENT_TYPE
from speech import recognize_from_microphone


def generate_model_update(
    current_model: Dict[str, Any],
    user_instruction: str,
    agent_type: str = DEFAULT_AGENT_TYPE,
) -> Dict[str, Any]:
    runner = AgentRunner(agent_type=agent_type)
    return runner.run(current_model=current_model, user_instruction=user_instruction)


if __name__ == "__main__":
    transcript = recognize_from_microphone()
    result = generate_model_update({"nodes": [], "edges": []}, transcript)
    print(json.dumps(result["model"], indent=2))
