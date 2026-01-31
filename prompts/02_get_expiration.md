Add logic to find the expiration date of each row.

Before scanning all the rows, first find the section headers, which has the expiration dates.
- Find div elements with class "ag-row", has an attribute "row-index", and has an attribute named "row-id" that starts with "row-group-expirationData-".
- Use the "row-id" attribute to determine the expiration date. Here is an example of the the row-id attribute value: "row-group-expirationData-Mar 20, 2026 (M)|in 49 days".
- Keep the following data during this parse step:
  - The value of the row-index attribute (integer)
  - The expiration date, stored as a JavaScript Date object (in the above example: March 20, 2026)
  - The number of days until expiration, as an integer (in the above example: 49)

Once this data is available, then process the rows to find the strike price, using the existing code. For each strike price found, add the following data attributes to that strike price div:
- data-expiration-date - set this to an ISO representation of the expiration date. Example: 2026-03-20
- data-expiration-days - set this to the number of days until expiration (integer)

To match a strike price to expiration data, you need to compare the current row you are processing against the row numbers found in the expiration scan. Find the expiration data that has the highest row-id but also lower than the current processing row number.

