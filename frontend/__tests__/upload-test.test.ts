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
  it("should handle no file selected error", async () => {
    const formData = new FormData();
    const response = await uploadFile(formData);
    expect(response.error).toBe("No file selected");
  });

  it("should handle missing Azure connection string error", async () => {
    const testFile = new File(["content"], "test.xlsx");
    const formData = new FormData();
    formData.append("file", testFile);
    // Clear environment variable for the test
    const originalConnectionString = process.env.NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING;
    process.env.NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING = "";

    const response = await uploadFile(formData);
    expect(response.error).toBe("Azure Storage connection string is missing");

    // Restore environment variable
    process.env.NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING = originalConnectionString;
  });

  it("should successfully upload a file", async () => {
    const testFile = new File(["content"], "test.xlsx");
    const formData = new FormData();
    formData.append("file", testFile);
    process.env.NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING = "fake_connection_string";

    const response = await uploadFile(formData);
    expect(response.success).toBe(true);
    expect(response.url).toBe("http://fake-url.com");
  });
});
