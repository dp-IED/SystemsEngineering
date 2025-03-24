"use client";

import { useState } from "react";
import { uploadFile } from "./actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";


export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const {toast} = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.length) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await uploadFile(formData);
    if (response.success) {
      toast({
          title: "File Uploaded. Please wait a few minutes for the system to generate the spreadsheets.",
          description: `File URL: ${response.url}`
        })
    } else {
      toast({
          variant: "destructive",
          title: "Error while uploading file",
          description: response.error
      })
    }
  };

  return (
    <div className="space-y-4">
      <h1>Upload File</h1>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="file">XLSX or CSV File</Label>
        <Input id="file" type="file" onChange={handleFileChange}/>
      </div>
      <Button onClick={handleUpload}>Upload</Button>
      <p>{message}</p>
    </div>
  );
}
