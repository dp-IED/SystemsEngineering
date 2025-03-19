import fastapi
from fastapi import UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = fastapi.FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BaseAzureRequest(BaseModel):
    token: str
    
class GetFilesRequest(BaseAzureRequest):
    storage_url: str
class Storage():
    def __init__(self, ):
        pass
    
    def upload_file(file: UploadFile):
        pass
    
    def get_all_files():
        pass
    
    def authenticate_request(token: str): # runs before each Azure dependent function
        pass
    

if __name__ == '__main__':
    storage = Storage()
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8080)