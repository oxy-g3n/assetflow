from toon_format import encode, decode
import os
import json
from openai import OpenAI
import ast
import yaml


endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4.1")
api_key = os.getenv("AZURE_OPENAI_API_KEY")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INSTRUCTIONS = {}

def load_instructions(folder="instructions"):
    '''Load all YAML instructions from the specified folder into the INSTRUCTIONS dictionary.'''
    global INSTRUCTIONS
    folder_path = os.path.join(BASE_DIR, folder)

    for file in os.listdir(folder_path):
        # print(f"Checking file: {file}")
        if file.endswith(".yaml"):
            path = os.path.join(folder_path, file)

            with open(path, "r") as f:
                data = yaml.safe_load(f)
                key = data.get("name")
                INSTRUCTIONS[key] = data


'''Cache INSTRUCTIONS on startup to avoid repeated file I/O during agent execution.'''
# @app.on_event("startup")
# def startup_event():
#   load_instructions()

class AgentRunner:
    def __init__(self, instruction):
        self.instruction = instruction
        self.client = OpenAI(base_url=endpoint, api_key=api_key)

    def save_conversation(self, input, output):
        # Save conversation history to SQL
        pass

    def load_conversation(self):
        # Load conversation history from SQL
        
        # 0th index is user input, 1st index is agent output
        #['Users purchase orders.', '[\n"""nodes[2]{id,type,x,y}:\n  user,User,0,0\n  order,Order,200,100\nedges[1]{source,target,label}:\n  user,order,purchases""",\n"Added relationship \'purchases\' from User to Order.",\n1\n]']
        return []

    def build_input_with_history(self, input, conversation_history):
        # Combine current input with conversation history for context
        return "\n".join(conversation_history + [input])

    # dimensional conceptual modeling agent
    def run_dm_cm_agent(self, input):
        
        # load conversation history and append to input for context
        conversation_history = self.load_conversation()

        if conversation_history:
            input = self.build_input_with_history(input, conversation_history)
        elif 'model' in input:
            # convert to TOON if model is present in user input
            toon_string = encode('<json_model_data>')
            input = toon_string + "\n" + input
        else:
            input = input

        response = self.client.responses.create(
        model=deployment_name,
        instructions=self.instruction,
        input=input
        )

        output = response.output[0].content[0].text

        try:
            # Convert string output to Python list
            output_list = ast.literal_eval(output)

            # convert TOON to JSON
            try:
                output_json = decode(output_list[0])
                if isinstance(output_json, dict):
                    print("\nParsed Nodes/Edges JSON:\n", output_json)
            except Exception:
                print("\nFirst element is not valid JSON, keeping as string.")
        except (ValueError, SyntaxError, json.JSONDecodeError) as e:
            print("\nFailed to parse output:", e)
            print("Continuing with conversation history.\n")
        
        if output_list[2] == 1:
            # Append ONLY relevant user input and model output to history
            self.save_conversation(input, output)

        return output_list
    

    def extract_important_response(self, response):
        """Extract important fields from an LLM response dict"""
        response_fields = {
            "id": response.get("id"),
            "created_at": response.get("created_at"),
            "completed_at": response.get("completed_at"),
            "model": response.get("model"),
            "status": response.get("status"),
            "temperature": response.get("temperature"),
            "output_text": [],
            "metadata": response.get("metadata", {}),
            "usage": response.get("usage", {}),
        }

        # Extract text from output
        for msg in response.get("output", []):
            for content in msg.get("content", []):
                if content.get("type") == "output_text":
                    response_fields["output_text"].append(content.get("text"))

        
        return response_fields