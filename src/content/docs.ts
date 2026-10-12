export type DocPlan = 'Free' | 'Starter' | 'Plus' | 'Max' | 'All plans' | 'Planned';

export interface DocSection {
  id: string;
  title: string;
  plan?: DocPlan;
  summary: string;
  content: string;
}

export interface DocGroup {
  title: string;
  items: DocSection[];
}

export const docGroups: DocGroup[] = [
  {
    title: 'Start',
    items: [
      {
        id: 'overview', title: 'Overview', plan: 'All plans',
        summary: 'A Windows desktop workspace with core chat and plan-specific tools.',
        content: `<h3>How Hive is organized</h3>
          <p>Hive is planned as a Windows desktop workspace. Its plan catalog separates core chat from research, agent, and PC workflows. The website provides account management and a scripted demo; it does not run prompts or control your computer.</p>`,
      },
      {
        id: 'get-hive', title: 'Download & Install', plan: 'Planned',
        summary: 'The v0.0.1 installer is not posted; release updates are on the changelog.',
        content: `<h3>Release status</h3>
          <p>There is no public installer download at this time. Hive v0.0.1 has no posted release date. Check the <a href="/changelog">changelog</a> for updates.</p>`,
      },
    ],
  },
  {
    title: 'Guide',
    items: [
      {
        id: 'workspace-ui', title: 'Workspace', plan: 'Planned',
        summary: 'The desktop app is designed to keep chats and project context together.',
        content: `<h3>Local work</h3>
          <p>Chats and the Mission Board stay on the device. This website does not run prompts. The homepage demo is a scripted preview and does not access Hive services, files, or your PC.</p>`,
      },
      {
        id: 'chat', title: 'Chat & search', plan: 'Free',
        summary: 'Hive Free includes core chat, 25,000 chat tokens, and 5 voice sessions per day.',
        content: `<h3>Hive Free limits</h3>
          <p>Hive Free is planned to include 25,000 chat tokens per day, 5 voice sessions per day, standard models, and core chat. Limits are daily plan allowances.</p>
          <h3>Cited research</h3>
          <p>Cited web research is planned from Starter. Research would return sources for you to inspect; it does not run on this website.</p>`,
      },
      {
        id: 'buddy', title: 'Buddy', plan: 'Plus',
        summary: 'Buddy is a planned Plus desktop companion.',
        content: `<h3>Buddy in the app</h3>
          <p>Buddy is planned for Plus. It is not available while v0.0.1 is unposted. In the desktop app, Buddy is meant to hide when Hive hides and return when Hive is shown.</p>`,
      },
      {
        id: 'notch', title: 'Notch & hotkeys', plan: 'Plus',
        summary: 'The Buddy notch is a planned Plus desktop shortcut.',
        content: `<h3>Open the notch</h3>
          <p>In the planned desktop app, <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>J</kbd> opens Buddy’s notch. The notch is part of Plus and is not a control on this website.</p>`,
      },
      {
        id: 'pc', title: 'PC control', plan: 'Starter',
        summary: 'Starter PC actions ask for Allow or Deny before they run.',
        content: `<h3>Approval flow</h3>
          <p>PC actions are planned for Starter. The desktop app presents an Allow/Deny decision before an action runs. Destructive commands are blocked before they reach that prompt, and actions are logged locally.</p>`,
      },
      {
        id: 'swarm', title: 'Swarm & bots', plan: 'Starter',
        summary: 'Standard agent swarm routing starts with Starter.',
        content: `<h3>Agent roster</h3>
          <p>Scout, Hive, and Pulse work together. Critic reviews the answer. Sentry watches tool calls. Standard swarm routing is planned from Starter; higher tiers include priority routing.</p>`,
      },
      {
        id: 'palette', title: 'Command palette', plan: 'Planned',
        summary: 'The planned desktop palette collects common Hive actions.',
        content: `<h3>Open the palette</h3>
          <p><kbd>Ctrl</kbd> + <kbd>K</kbd> opens the command palette in the planned desktop app. It is not available on this website.</p>`,
      },
      {
        id: 'modes', title: 'Modes', plan: 'Planned',
        summary: 'Model access and request priority depend on the selected plan.',
        content: `<h3>Plan access</h3>
          <p>Standard models are planned for Hive Free, Starter, and Plus. Max is planned to include the fastest models and top priority. Model availability and plan details may change before checkout opens.</p>`,
      },
      {
        id: 'cloud', title: 'HiveBox', plan: 'Plus',
        summary: 'HiveBox cloud disk is planned for Plus; background tasks are planned for Max.',
        content: `<h3>Plan availability</h3>
          <p>HiveBox cloud disk is planned for Plus. HiveBox background tasks are planned for Max. The Mission Board stays on the device when it ships.</p>`,
      },
    ],
  },
  {
    title: 'Reference',
    items: [
      {
        id: 'settings', title: 'Settings', plan: 'Planned',
        summary: 'This reference describes settings planned for the Windows desktop app.',
        content: `<h3>Planned settings reference</h3>
          <p>Planned desktop controls. They do nothing on this website.</p>
          <div class="docs-table-scroll" role="region" aria-label="Planned desktop settings" tabindex="0">
            <table>
              <caption>Settings planned for the Hive desktop app</caption>
              <thead><tr><th scope="col">Area</th><th scope="col">Planned controls</th></tr></thead>
              <tbody>
                <tr><th scope="row">General</th><td>Chat preferences, workspace behavior, and local history controls.</td></tr>
                <tr><th scope="row">Models</th><td>Plan-eligible model access and request preferences.</td></tr>
                <tr><th scope="row">Appearance</th><td>Accent color and reduced-motion preference.</td></tr>
                <tr><th scope="row">Integrations</th><td>Connection setup and permissions when available.</td></tr>
              </tbody>
            </table>
          </div>`,
      },
      {
        id: 'shortcuts', title: 'Shortcuts', plan: 'Planned',
        summary: 'This reference describes keyboard controls planned for the desktop app.',
        content: `<h3>Keyboard reference</h3>
          <p>Planned desktop controls. They do nothing on this website.</p>
          <div class="docs-table-scroll" role="region" aria-label="Planned desktop keyboard shortcuts" tabindex="0">
            <table>
              <caption>Keyboard shortcuts planned for the Hive desktop app</caption>
              <thead><tr><th scope="col">Shortcut</th><th scope="col">Planned action</th></tr></thead>
              <tbody>
                <tr><th scope="row"><kbd>Ctrl</kbd> + <kbd>K</kbd></th><td>Open the command palette.</td></tr>
                <tr><th scope="row"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>J</kbd></th><td>Open Buddy’s notch (Plus).</td></tr>
                <tr><th scope="row"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>H</kbd></th><td>Show or hide the Hive window.</td></tr>
                <tr><th scope="row"><kbd>Enter</kbd></th><td>Send a message.</td></tr>
                <tr><th scope="row"><kbd>Shift</kbd> + <kbd>Enter</kbd></th><td>Insert a newline.</td></tr>
                <tr><th scope="row"><kbd>Esc</kbd></th><td>Close a dialog or Buddy’s notch.</td></tr>
              </tbody>
            </table>
          </div>`,
      },
    ],
  },
  {
    title: 'Help',
    items: [
      {
        id: 'faq', title: 'FAQ',
        summary: 'Answers about supported platform, availability, and account data.',
        content: `<details class="docs-faq"><summary>Windows only?</summary><p>Windows 10/11 is the planned platform. The click and type engine is Windows-native. It is not available while v0.0.1 is unposted.</p></details>
          <details class="docs-faq"><summary>Is Hive free?</summary><p>Hive Free is planned with its published daily limits. Paid plans are monthly, but checkout is not open and the public installer is not posted.</p></details>
          <details class="docs-faq"><summary>Where is my data?</summary><p>Chats and the Mission Board stay on the device. This site does not run prompts. Account sign-in and profile details are handled on this website.</p></details>
          <details class="docs-faq"><summary>Where is Buddy?</summary><p>Buddy is planned for Plus. It is not on this website. In the desktop app, Buddy is meant to hide when Hive hides and return when Hive is shown.</p></details>`,
      },
      {
        id: 'security', title: 'Security',
        summary: 'Keep account credentials private and review desktop actions before approval.',
        content: `<h3>Account safety</h3>
          <p>Hive uses Supabase for sign-in and account storage. Your browser keeps the active session locally so you stay signed in across Hive pages; you can sign out from your profile at any time.</p>
          <ul><li>Use a unique password and do not share your sign-in session.</li><li>Sign out on shared or public computers after using your account.</li><li>Contact <a href="mailto:apis.new.world@gmail.com">apis.new.world@gmail.com</a> if you see unexpected account activity.</li></ul>
          <p>For password recovery, use <strong>Forgot password?</strong> on the <a href="/auth">sign-in page</a>.</p>`,
      },
    ],
  },
  {
    title: 'Legal',
    items: [
      {
        id: 'privacy', title: 'Privacy',
        summary: 'How Hive handles account, usage, and local app data.',
        content: `<p><i>Last updated: September 2026.</i> Hive ("we", "Apis") makes the Hive desktop app and the hivetools.pro website.</p>
          <h3>What we collect</h3>
          <ul><li><b>Account data:</b> your email and account profile information when you sign up.</li><li><b>Purchase data:</b> Checkout is not open yet; no Hive purchases can currently be made through this site.</li><li><b>Usage data:</b> token and voice-session counters, so your daily quota is enforced on our side rather than only on your machine.</li><li><b>Local data stays local:</b> your chats, settings and transcripts live on your machine, not on our servers. They are <b>not</b> synced between your devices.</li></ul>
          <h3>How we use it</h3><p>To run your account, enforce quotas, provide product information, and improve Hive. We do not sell your data and we do not show ads.</p>
          <h3>Sharing</h3><p>We use Supabase for account hosting, authentication and database services, and Google when you choose Google sign-in. Model requests are sent to the provider selected in the app. <!-- TODO: Name the model providers used by the released app and confirm provider-specific privacy disclosures before publication. --> Payment processing is not active while checkout is closed.</p>
          <h3>Your rights</h3><p>Ask for a copy, correction or deletion of your data any time at <a href="mailto:apis.new.world@gmail.com">apis.new.world@gmail.com</a>. Deleting your account removes your profile, quota and subscription rows; PayPal keeps its own transaction records.</p>
          <h3>Retention</h3><p>We keep account and purchase records while your account exists and up to 3 years after, for fraud prevention and accounting. Anonymized usage stats may be kept longer.</p>`,
      },
      {
        id: 'terms', title: 'Terms',
        summary: 'Terms for using the website and the Hive app when a release is posted.',
        content: `<p><i>Last updated: September 2026.</i> By using this website, or the Hive app when a release is posted, you agree to these terms.</p>
          <h3>License</h3><p>Planned Hive plans and features are described on the <a href="/pricing">pricing page</a>. Checkout is not open yet, and no paid plan can currently be purchased.</p>
          <h3>Token plans</h3><p>The planned paid plans are monthly subscriptions. Checkout is not open yet; billing, cancellation, renewal and quota terms will be published before purchases are enabled.</p>
          <h3>Fair use</h3><p>Don't use Hive to harm systems you don't own or have permission to touch. PC-control actions require your explicit Allow.</p>
          <h3>Availability</h3><p>Hive is a preview (Windows 10/11). Features may change, break or move between plans. We aim for reliability but give no uptime guarantees.</p>
          <h3>Refunds</h3><p>Checkout is not open yet. Purchase, cancellation and refund terms will be published before paid plans are offered.</p>
          <h3>Liability</h3><p>Hive is provided "as is". To the maximum extent allowed by law, we are not liable for indirect damages or for actions the app takes with your approval.</p>
          <h3>Contact</h3><p>Questions about these terms: <a href="mailto:apis.new.world@gmail.com">apis.new.world@gmail.com</a>.</p>`,
      },
    ],
  },
];
