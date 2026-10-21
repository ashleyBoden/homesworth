export async function getPostcodeData(postcode) {
    const postcodeRes = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
    const postcodeData = await postcodeRes.json();

    if (postcodeData.status !== 200) {
      throw new Error("Postcode not found. Please check and try again.");
    }

    return postcodeData
}