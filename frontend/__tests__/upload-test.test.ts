//import { uploadFile } from "@/app/upload/actions";
//import fs from "fs";
//import path from "path";

//describe("File Upload", () => {
//  it("should upload the controlled file to Azure Blob Storage", async () => {
//    // Arrange: Read the controlled file
//    const filePath = path.resolve(__dirname, "test-docs/Chanel UK Billed.xlsx");
//    const fileBuffer = fs.readFileSync(filePath);
//    const testFile = new File([fileBuffer], "Chanel UK Billed.xlsx");

//    const formData = new FormData();
//    formData.append("file", testFile);

//    const result = await uploadFile(formData);

//    if (!result.success) {
//      console.error("File upload failed:", result.error || "Unknown error");
//    }

//    expect(result.success).toBe(true);
//    expect(result.url).toContain("Chanel%20UK%20Billed.xlsx"); // url encoded filename
//  });
//});
