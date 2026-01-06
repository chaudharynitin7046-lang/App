
/**
 * To use this service, create a Google Apps Script with doPost(e) and doGet(e) functions.
 */
export const syncToGoogleSheets = async (url: string, data: any) => {
  if (!url) return false;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
      }),
    });
    return true;
  } catch (error) {
    console.error("Sheet Sync Error:", error);
    return false;
  }
};

export const fetchFromGoogleSheets = async (url: string) => {
  if (!url) return null;
  try {
    // We add a 'get' parameter to tell the script we want to READ data
    const finalUrl = url.includes('?') ? `${url}&action=get` : `${url}?action=get`;
    const response = await fetch(finalUrl);
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data; // Expected { customers: [], transactions: [] }
  } catch (error) {
    console.error("Sheet Fetch Error:", error);
    return null;
  }
};
