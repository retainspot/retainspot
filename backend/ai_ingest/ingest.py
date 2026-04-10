import os
from pinecone import Pinecone
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader, StorageContext
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

PINECONE_API_KEY = "..."
INDEX_NAME = "retainspot-knowledge"

pc = Pinecone(api_key='...')
pinecone_index = pc.Index(INDEX_NAME)
embed_model = HuggingFaceEmbedding(model_name="sentence-transformers/all-MiniLM-L6-v2")

def run_ingestion():
    documents = SimpleDirectoryReader("./data").load_data()
    vector_store = PineconeVectorStore(pinecone_index=pinecone_index)
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    VectorStoreIndex.from_documents(
        documents, 
        storage_context=storage_context,
        embed_model=embed_model
    )
    print("Done!")

if __name__ == "__main__":
    run_ingestion()