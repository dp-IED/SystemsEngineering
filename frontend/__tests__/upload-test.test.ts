import { BlobServiceClient } from "@azure/storage-blob";
import { uploadFile } from "@/app/upload/actions";


jest.mock("@azure/storage-blob", () => {
  const originalModule = jest.requireActual("@azure/storage-blob");

  return {
    ...originalModule,
    BlobServiceClient: jest.fn(() => ({
      getContainerClient: jest.fn(() => ({
        getBlockBlobClient: jest.fn(() => ({
          upload: jest.fn().mockResolvedValue({}),
          url: "http://fake-url.com"
        }))
      }))
    }))
  };
});

describe("File Upload", () => {
    it("should successfully upload a file", async () => {
      const mockFileContent = Buffer.from("Hello World");
      const testFile = new File([mockFileContent], "test.xlsx");
      const formData = new FormData();
      formData.append("file", testFile);
  
      process.env.NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING = "fake-connection-string";
  
      // Call your actual function here
      const result = await uploadFile(formData);
  
      expect(result.success).toBe(true);
      expect(result.url).toBe("http://fake-url.com");
    });
  });
  

  // Jest manual mock setup for Azure Storage Blob
jest.mock('@azure/storage-blob', () => {
    return {
      BlobServiceClient: {
        fromConnectionString: jest.fn(() => ({
          getContainerClient: jest.fn(() => ({
            getBlockBlobClient: jest.fn(() => ({
              upload: jest.fn().mockResolvedValue({}),
              url: "http://fake-url.com"
            }))
          }))
        }))
      }
    };
  });
  

