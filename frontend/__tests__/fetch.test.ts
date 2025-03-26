import { fetchSummarySpreadsheet } from "@/app/actions";

describe("Summary File Download", () => {
  it("should download the file from the summary directory in blob", async () => {
    
    const res = await fetchSummarySpreadsheet()

    expect(res).toBeInstanceOf(Buffer<ArrayBufferLike>)
  });
});
