export const saveReportToFile = async (reportData) => {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: "forklift_report.txt",
      types: [
        {
          description: "Text Files",
          accept: { "text/plain": [".txt"] },
        },
      ],
    });

    const writable = await handle.createWritable();
    await writable.write(reportData);
    await writable.close();

    alert("Report saved successfully!");
  } catch (error) {
    console.error("Error saving report:", error);
    alert("Failed to save report");
  }
};
