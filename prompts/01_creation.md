Build a Firefox browser extension with the following characteristics:

- If the user is on the "options research" page for a specific stock, the extension will activate and scan the page
- First, identify the current price of the security, which will be in a span with class "oar-quote-last". Remember this value for the rest of the page.
- Next, scan the table of the options prices (contained in the div with class "ag-center-cols-container" and attribute 'data-ref="eContainer"') to find each option details
  - Each option row will be a div with a class of "ag-row"
- Within each row, find the strike price cell. That will be the div with attribute 'col-id="strike"'
- If the strike price for that row is less than the current price of the security, change the strike price HTML node's background color to a light blue color.

An example of the full HTML page is available in the file [references/example.html](references/example.html)

The URL of the "options research" page is https://digital.fidelity.com/ftgw/digital/options-research/?symbol=XOM, where the "symbol=XXX" part will show the actual security symbol (in this case, XOM). 
