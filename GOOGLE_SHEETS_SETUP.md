# Connect the enquiry form to Google Sheets

The contact form saves the submission time, name, email, mobile number, graduation year, college or company, and interested learning domain to the first tab of a Google Sheet. The first submission adds the column headers if the tab is empty.

## Set up the Google Sheet endpoint

1. Create or open the Google Sheet that should receive enquiries.
2. In the Sheet, select **Extensions → Apps Script**.
3. Replace the editor contents with the code in [`google-apps-script/Code.gs`](./google-apps-script/Code.gs), then save.
4. Copy the spreadsheet ID from its URL (`https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`) and replace `PASTE_GOOGLE_SHEET_ID_HERE` at the top of the Apps Script code.
5. Select **Deploy → New deployment**, choose **Web app**, and set:
   - **Execute as:** Me
   - **Who has access:** Anyone
6. Deploy, authorize the requested Sheet access, and copy the web app URL ending in `/exec`.
7. Paste that URL into `GOOGLE_SHEETS_WEB_APP_URL` near the top of [`src/main.js`](./src/main.js).
8. Publish the updated website and test one submission. The first submission creates the `Submitted At`, `Name`, `Email`, `Mobile Number`, `Year of Graduation`, `College or Company`, and `Interested Domain` headers in the first tab.

The endpoint must be public so visitors who are not signed in to Google can submit the form. The Apps Script validates fields on the server and stores visitor-provided text as plain text rather than spreadsheet formulas. Keep the Sheet private; do not publish it or put credentials in the website.

When you change the Apps Script code later, create a new version via **Deploy → Manage deployments → Edit** and deploy it. If the existing sheet already has the older headers, add the three new columns (`Mobile Number`, `Year of Graduation`, and `College or Company`) to the header row before using the updated script.
