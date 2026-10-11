// Single source of plain-language content: used by the landing page, the in-app Help panel and the (i) tips.
// Keep every sentence something a first-time reporter can understand.

export const GLOSSARY = {
  spf: { term: 'SPF', short: 'Is this server allowed to send email for this domain?', long: 'A domain publishes a list of servers that may send mail for it. SPF checks the sending server against that list. A failure means the email may come from someone pretending to be the domain.' },
  dkim: { term: 'DKIM', short: 'Does the email carry a valid digital signature?', long: 'The sending server signs each email to prove it really came from that domain and was not changed on the way. "Not present" means the email was not signed, which is common in fake emails.' },
  dmarc: { term: 'DMARC', short: 'Does the email follow the domain\'s own rules?', long: 'DMARC is the domain owner\'s policy. It says SPF or DKIM must line up with the address you see in "From", and what to do with emails that fail. A fail means the email breaks the domain\'s own rules.' },
  phishing: { term: 'Phishing', short: 'A fake email that tricks you into giving something away.', long: 'It usually pushes you to enter a password, pay money or open something harmful, often with urgent wording like "verify within 24 hours".' },
  bec: { term: 'BEC (business email compromise)', short: 'A scam that pretends to be your boss, a vendor or a colleague.', long: 'BEC emails are often short and polite with no suspicious link. They ask for a payment, gift cards or changed bank details, so they are easy to miss.' },
  spoofing: { term: 'Spoofing', short: 'Faking the sender so an email looks like it came from someone else.', long: 'The name you see in "From" can be set by anyone. Checks like SPF, DKIM and DMARC, plus the relay path, show whether the sender is genuine.' },
  relay: { term: 'Relay path', short: 'The chain of mail servers the email passed through.', long: 'Every server adds a "Received" line to the hidden headers. MailRakshak reads them from oldest to newest to rebuild the route, and flags jumps that do not add up, such as timestamps out of order.' },
  origin: { term: 'Origin IP', short: 'The first outside address that sent the email.', long: 'The earliest public IP address in the relay path. It is placed on the map and is usually the best clue to where the email really came from.' },
  infra: { term: 'Hosting, VPN or Tor network', short: 'Networks that real senders rarely use.', long: 'Attackers often send from rented servers, VPNs or Tor to hide who they are. It is a warning sign, not proof: some genuine bulk email also comes from hosting networks.' },
  domainAge: { term: 'Domain age', short: 'How long ago the sender\'s domain was registered.', long: 'Fake emails often use domains registered only days ago, especially ones that imitate a known brand. A very new domain is a warning sign.' },
  dns: { term: 'DNS mismatch', short: 'The domain\'s records do not match how the email was sent.', long: 'For example the domain has no mail records, or the email came from a server the domain does not list. Genuine senders normally have these in order.' },
  campaign: { term: 'Campaign', short: 'A group of emails that share the same attacker infrastructure.', long: 'When emails share an IP range, network, country or domain pattern, they are grouped. One attacker then shows up as one campaign instead of many unrelated alerts.' },
  fraud: { term: 'Fraud score', short: 'How strongly the wording looks like phishing or BEC (0 to 100).', long: 'It comes from the AI reading the subject and body. A high score means the text matches known scam patterns. For emails judged legitimate, the score is low.' },
  spoofRisk: { term: 'Spoofing risk', short: 'How likely it is that the sender is faked (0 to 100).', long: 'It comes from the header checks: SPF, DKIM, DMARC, mismatched return addresses and odd relay hops. Higher means more signs of a faked sender.' },
  overall: { term: 'Overall risk', short: 'The combined verdict, from 0 to 100.', long: 'It is the average of the fraud score and the spoofing risk. Low is 0 to 29, Medium 30 to 59, High 60 to 84 and Critical 85 to 100.' },
  eml: { term: '.eml file', short: 'A saved copy of an email, including its hidden headers.', long: 'The headers hold the technical clues (who sent it, which servers handled it). Forwarding an email loses them, so MailRakshak needs the saved .eml file.' },
  fingerprint: { term: 'Evidence fingerprint', short: 'A short code that changes if the case record is altered.', long: 'When an admin confirms a threat, only this fingerprint (never the email itself) is anchored on a public blockchain test network. Anyone can later check the record was not changed.' },
};

export const PIPELINE = [
  { id: 'report', nav: 'Report', tag: 'Chapter 01 · Report', title: 'Every investigation starts with one email', body: 'Upload a suspicious .eml and MailRakshak takes it from there. Each report becomes its own case with an ID.',
    points: ['Save the email from Gmail, Outlook or Apple Mail', 'No headers to copy by hand', 'Drop the file in, press Run analysis'], app: 'Analyze email page' },
  { id: 'detect', nav: 'Detect', tag: 'Chapter 02 · Detect', title: 'AI reads the message', body: 'Subject and body are classified as legitimate, suspicious, phishing or business email compromise (BEC).',
    points: ['A label for the email', 'A confidence score for that label', 'The exact phrases that raised the flag'], app: 'Case page, "Indicators and flags"' },
  { id: 'verify', nav: 'Verify', tag: 'Chapter 03 · Verify', title: 'Is the sender who they claim to be?', body: 'SPF, DKIM and DMARC are checked, then the relay path is rebuilt hop by hop.',
    points: ['Pass or fail for SPF, DKIM and DMARC', 'Forged return paths and out-of-order timestamps', 'A spoofing risk score'], app: 'Case page, "Sender authentication"' },
  { id: 'trace', nav: 'Trace', tag: 'Chapter 04 · Trace', title: 'Where did it really come from?', body: 'The sending IP is located on a map and checked for VPN, Tor and hosting networks.',
    points: ['The origin placed on a map', 'Network type and country', 'Domain age and DNS record checks'], app: 'Case page, "Trace path"' },
  { id: 'connect', nav: 'Connect', tag: 'Chapter 05 · Connect', title: 'One attacker, one campaign', body: 'Emails that share infrastructure are grouped, so related attacks surface together.',
    points: ['Related emails linked automatically', 'See what the emails have in common', 'Spot an attacker\'s pattern early'], app: 'Campaigns page' },
  { id: 'prove', nav: 'Prove', tag: 'Chapter 06 · Prove', title: 'Evidence that cannot be quietly changed', body: 'When an admin confirms a threat, a fingerprint of the case is anchored on a public blockchain test network.',
    points: ['Only the fingerprint is stored, never the email', 'Anyone can check the record is unchanged', 'A report covers every stage and the timeline'], app: 'Admin tools' },
];

export const RISK_BANDS = [
  { key: 'low', label: 'Low', range: '0 to 29', text: 'Nothing alarming found.' },
  { key: 'medium', label: 'Medium', range: '30 to 59', text: 'Be careful and check the sender another way.' },
  { key: 'high', label: 'High', range: '60 to 84', text: 'Very likely fraudulent. Do not engage.' },
  { key: 'critical', label: 'Critical', range: '85 to 100', text: 'Confirmed-pattern threat. Delete and report.' },
];

export const EML_STEPS = {
  Gmail: ['Open the suspicious email.', 'Click the three dots (⋮) at the top right of the message.', 'Choose "Download message". A .eml file is saved.'],
  'Apple Mail': ['Select the email in your list.', 'Choose File, then Save As.', 'Set the format to "Raw Message Source" and save.'],
  Thunderbird: ['Select the email.', 'Choose File, then Save As, then File.', 'Save it; Thunderbird writes a .eml file.'],
  Outlook: ['Open Outlook on the web or the new Outlook.', 'Drag the email from the message list onto your desktop.', 'It is saved as a .eml file. (Older desktop Outlook may save .msg; use Gmail or forward as an attachment instead.)'],
};

export const ROLE_INFO = [
  { key: 'reporter', name: 'Reporter', best: 'Anyone who gets a suspicious email', can: ['Upload an email and get a plain-language verdict', 'See what to do next', 'No technical knowledge needed'], access: 'Register on the sign-in page with your name, phone and email. You sign in with a one-time code.' },
  { key: 'analyst', name: 'Analyst', best: 'People who investigate threats', can: ['See every case with scores and flags', 'Read authentication results, relay path and origin map', 'Follow campaigns across related emails'], access: 'An admin adds you. You sign in with your password and an emailed code.' },
  { key: 'admin', name: 'Admin', best: 'Team leads running the queue', can: ['Everything an analyst can do', 'Assign analysts to cases', 'Add new analysts to the team'], access: 'The super admin adds you. You sign in with your password and an emailed code.' },
  { key: 'superadmin', name: 'Super admin', best: 'The owner of the whole system', can: ['Everything an admin can do', 'Add admins and analysts', 'Change anyone\'s role'], access: 'Created by the system owner. Signs in through the Admin tab.' },
];

export const FAQ = [
  { q: 'Do I need technical knowledge?', a: 'No. Reporters get a plain-language verdict and clear advice. Analysts see the technical detail, and every technical term has an (i) icon that explains it.' },
  { q: 'What file do I upload?', a: 'A .eml file, which is a saved copy of the email with its hidden headers. Forwarding the email is not enough because it loses those headers. The "Start here" section shows how to save one from Gmail, Apple Mail, Thunderbird or Outlook.' },
  { q: 'How long does the analysis take?', a: 'Usually a few seconds. You can leave the page while it runs. Progress and the result appear in a card at the bottom right.' },
  { q: 'What do the risk levels mean?', a: 'Low is 0 to 29, Medium 30 to 59, High 60 to 84 and Critical 85 to 100. The score combines how scam-like the wording is with how likely the sender is faked.' },
  { q: 'What should I do with a flagged email?', a: 'Do not click links, open attachments or reply. Delete it, and tell your IT or security team. If the result is Medium, do not enter passwords or payment details unless you can confirm the sender another way.' },
  { q: 'Is my email stored on a blockchain?', a: 'No. Only a short fingerprint of the case is anchored, and only when an admin confirms a threat. The email itself is never put on the blockchain.' },
  { q: 'Who can see my report?', a: 'Reporters see their own plain-language verdict. Analysts and admins can open the full case, including the technical detail.' },
  { q: 'How do I get an account?', a: 'Reporters register themselves on the sign-in page. Analysts and admins are added by an admin or super admin from the Team page.' },
  { q: 'I forgot my password.', a: 'Analysts and admins: choose "Forgot your password?" on the sign-in page and follow the email. Reporters have no password; a one-time code is emailed each time you sign in.' },
];

// What each page is for, shown in the Help panel and in the page tips.
export const PAGE_GUIDE = {
  dashboard: { title: 'Dashboard', what: 'Your queue of analysed emails, newest first.', steps: ['The four cards at the top summarise the queue.', 'Use the risk chips, search, domain and date filters to narrow the list.', 'Click any row to open the full case.'] },
  upload: { title: 'Analyze an email', what: 'Upload a suspicious email and get a verdict.', steps: ['Save the email as a .eml file (see the steps on this page).', 'Drop the file in the box and press "Run analysis".', 'Watch progress in the card at the bottom right; you can leave the page.'] },
  case: { title: 'Case detail', what: 'Everything MailRakshak found about one email.', steps: ['Start with "In plain words" for the short version.', 'Score breakdown and Sender authentication show why the score is what it is.', 'Trace path shows where it really came from. Related cases show the same attacker.'] },
  campaigns: { title: 'Campaigns', what: 'Emails grouped by shared attacker infrastructure.', steps: ['Each card is one campaign; click it to expand.', '"What these emails share" explains why they were grouped.', 'Click a case inside to open it.'] },
  team: { title: 'Team', what: 'Add people and manage roles.', steps: ['Fill in the form and share the temporary password privately.', 'The new person must choose their own password at first sign-in.', 'Only a super admin can change roles.'] },
};
