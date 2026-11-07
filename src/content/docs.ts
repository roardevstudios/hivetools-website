export type DocPlan = 'Free' | 'Pro' | 'Max' | 'All plans' | 'Planned';

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
        summary: 'A Windows desktop workspace. v0.0.1.1 includes chat, cited research, and PC actions.',
        content: `<h3>How Hive is organized</h3>
          <p>Hive v0.0.1.1 is a Windows desktop workspace. This installer includes core chat, cited web research, agent tools, and PC actions that ask for Allow or Deny. The plan catalog still lists Pro and Max limits, but paid checkout is closed. The website provides account management and a scripted demo; it does not run prompts or control your computer.</p>`,
      },
      {
        id: 'get-hive', title: 'Download & Install', plan: 'All plans',
        summary: 'Hive-Setup-v0.0.1.1.exe is on the download page.',
        content: `<h3>Release status</h3>
          <p>The public Windows installer is <strong>Hive-Setup-v0.0.1.1</strong>, published October 29, 2026. Download it from the <a href="/download">download page</a>. It includes core chat, cited web research, agent tools, and PC actions with Allow or Deny. Hive Design and connectors are in this installer. Buddy is not in this installer. Paid checkout is closed. Windows may warn about an unknown publisher because there is no code-signing certificate. macOS and Linux are not in this installer. Check the <a href="/changelog">changelog</a> for the same notes.</p>`,
      },
    ],
  },
  {
    title: 'Guide',
    items: [
      {
        id: 'workspace-ui', title: 'Workspace', plan: 'All plans',
        summary: 'The desktop app is designed to keep chats and project context together.',
        content: `<h3>Local work</h3>
          <p>Chats stay on the device. This website does not run prompts. The homepage demo is a scripted preview and does not access Hive services, files, or your PC.</p>`,
      },
      {
        id: 'chat', title: 'Chat & search', plan: 'Free',
        summary: 'This installer includes core chat and cited research. The Free catalog lists 25,000 chat tokens and 5 voice sessions per day.',
        content: `<h3>Hive Free limits</h3>
          <p>Hive Free ships with this installer: core chat, cited research, and the published daily allowances of 25,000 chat tokens and 5 voice sessions. Paid Pro and Max allowances are catalog prices only. Checkout is closed.</p>
          <h3>Cited research</h3>
          <p>Cited web research is in this installer. It returns sources for you to inspect. It does not run on this website.</p>`,
      },
      {
        id: 'buddy', title: 'Buddy', plan: 'Max',
        summary: 'Buddy is not in the v0.0.1.1 installer.',
        content: `<h3>Buddy in the app</h3>
          <p>Buddy is not in this installer. The plan catalog lists it for Max, and checkout is closed. When Buddy ships, it is meant to hide when Hive hides and return when Hive is shown.</p>`,
      },
      {
        id: 'notch', title: 'Notch & hotkeys', plan: 'Max',
        summary: 'The Buddy notch is not in the v0.0.1.1 installer.',
        content: `<h3>Open the notch</h3>
          <p>The Buddy notch is not in this installer. The shortcut reserved for it is <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>J</kbd>. It is not a control on this website.</p>`,
      },
      {
        id: 'pc', title: 'PC control', plan: 'Free',
        summary: 'This installer asks for Allow or Deny before a PC action runs.',
        content: `<h3>Approval flow</h3>
          <p>PC actions are in this installer. The desktop app presents an Allow or Deny decision before an action runs. Destructive commands are blocked before they reach that prompt, and actions are logged locally. The plan catalog includes them on Hive Free, Pro, and Max. Checkout is closed.</p>`,
      },
      {
        id: 'swarm', title: 'Swarm & bots', plan: 'Free',
        summary: 'Agent tools in this installer: Scout, Hive, Pulse, Critic, and Sentry.',
        content: `<h3>Agent roster</h3>
          <p>This installer includes the agent crew. Scout, Hive, and Pulse work together. Critic reviews the answer. Sentry watches tool calls. The plan catalog includes swarm routing on Hive Free, standard routing on Pro, and top priority on Max. Checkout is closed, so paid priority is not unlocked by this installer.</p>`,
      },
      {
        id: 'palette', title: 'Command palette',
        summary: 'Ctrl+K opens the command palette in the desktop app. It is not a control on this website.',
        content: `<h3>Open the palette</h3>
          <p><kbd>Ctrl</kbd> + <kbd>K</kbd> opens the command palette in the desktop app. The v0.0.1.1 release notes do not list the palette on its own. It is not a control on this website.</p>`,
      },
      {
        id: 'modes', title: 'Modes',
        summary: 'Model access and request priority depend on the selected plan.',
        content: `<h3>Plan access</h3>
          <p>Hive Free uses Bonsai. Pro uses Qwen. Max uses Nemotron with top priority. Model availability and plan details may change before checkout opens.</p>`,
      },
      {
        id: 'cloud', title: 'HiveBox', plan: 'Max',
        summary: 'HiveBox is a Max catalog item. It is not named in the v0.0.1.1 release notes.',
        content: `<h3>Plan availability</h3>
          <p>HiveBox cloud disk and background tasks are listed for Max. They are not named in the v0.0.1.1 release notes. Paid checkout is closed, so Max is not unlocked by this installer.</p>`,
      },
    ],
  },
  {
    title: 'Reference',
    items: [
      {
        id: 'settings', title: 'Settings',
        summary: 'Settings for the Windows desktop app. They do nothing on this website.',
        content: `<h3>Settings reference</h3>
          <p>Desktop controls. They do nothing on this website. The v0.0.1.1 release notes do not list each setting.</p>
          <div class="docs-table-scroll" role="region" aria-label="Desktop settings" tabindex="0">
            <table>
              <caption>Settings in the Hive desktop app</caption>
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
        id: 'shortcuts', title: 'Shortcuts',
        summary: 'Keyboard controls for the desktop app. They do nothing on this website.',
        content: `<h3>Keyboard reference</h3>
          <p>Desktop controls. They do nothing on this website. Buddy’s notch shortcut is not in this installer.</p>
          <div class="docs-table-scroll" role="region" aria-label="Desktop keyboard shortcuts" tabindex="0">
            <table>
              <caption>Keyboard shortcuts in the Hive desktop app</caption>
              <thead><tr><th scope="col">Shortcut</th><th scope="col">Planned action</th></tr></thead>
              <tbody>
                <tr><th scope="row"><kbd>Ctrl</kbd> + <kbd>K</kbd></th><td>Open the command palette.</td></tr>
                <tr><th scope="row"><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>J</kbd></th><td>Open Buddy’s notch (Max).</td></tr>
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
        content: `<details class="docs-faq"><summary>Windows only?</summary><p>This installer is Windows 10/11 only. The click and type engine is Windows-native. macOS and Linux are not in this installer.</p></details>
          <details class="docs-faq"><summary>Is Hive free?</summary><p>Hive Free is included with Hive-Setup-v0.0.1.1.exe. Paid plans are monthly, and checkout is closed. The installer is on the <a href="/download">download page</a>.</p></details>
          <details class="docs-faq"><summary>Where is my data?</summary><p>Chats stay on the device. This site does not run prompts. Account sign-in and profile details are handled on this website.</p></details>
          <details class="docs-faq"><summary>Where is Buddy?</summary><p>Buddy is not in this installer and not on this website. The plan catalog lists it for Max. Checkout is closed.</p></details>`,
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
        content: `<p><i>Last updated: October 2026.</i> Hive ("we", "Apis") makes the Hive desktop app and the hivetools.pro website.</p>
          <h3>What we collect</h3>
          <ul><li><b>Account data:</b> your email and account profile information when you sign up.</li><li><b>Purchase data:</b> Checkout is not open yet; no Hive purchases can currently be made through this site.</li><li><b>Usage data:</b> token and voice-session counters, so your daily quota is enforced on our side rather than only on your machine.</li><li><b>Local data stays local:</b> your chats, settings and transcripts live on your machine, not on our servers. They are <b>not</b> synced between your devices.</li></ul>
          <h3>How we use it</h3><p>To run your account, enforce quotas, provide product information, and improve Hive. We do not sell your data and we do not show ads.</p>
          <h3>Sharing</h3><p>We use Supabase for account hosting, authentication and database services, and Google when you choose Google sign-in. Model requests are sent to the provider selected in the app. <!-- TODO: Name the model providers used by the released app and confirm provider-specific privacy disclosures before publication. --> Payment processing is not active while checkout is closed.</p>
          <h3>Your rights</h3><p>Email <a href="mailto:apis.new.world@gmail.com">apis.new.world@gmail.com</a> to ask for a copy, correction or deletion of your data at that address. Deleting your account removes your profile, quota and subscription rows; PayPal keeps its own transaction records.</p>
          <h3>Retention</h3><p>We keep account and purchase records while your account exists and up to 3 years after, for fraud prevention and accounting. Anonymized usage stats may be kept longer.</p>`,
      },
      {
        id: 'terms', title: 'Terms',
        summary: 'Terms for using the website and the Hive Windows app.',
        content: `<p><i>Last updated: September 2026.</i> By using this website, or the Hive Windows app, you agree to these terms.</p>
          <h3>License</h3><p>Planned Hive plans and features are described on the <a href="/pricing">pricing page</a>. Checkout is not open yet, and no paid plan can currently be purchased.</p>
          <h3>Token plans</h3><p>Pro and Max are monthly subscriptions. Checkout is not open yet; billing, cancellation, renewal and quota terms will be published before purchases are enabled.</p>
          <h3>Fair use</h3><p>Don't use Hive to harm systems you don't own or have permission to touch. PC-control actions require your explicit Allow.</p>
          <h3>Availability</h3><p>Hive is a preview (Windows 10/11). Features may change, break or move between plans. We aim for reliability but give no uptime guarantees.</p>
          <h3>Refunds</h3><p>Checkout is not open yet. Purchase, cancellation and refund terms will be published before paid plans are offered.</p>
          <h3>Liability</h3><p>Hive is provided "as is". To the maximum extent allowed by law, we are not liable for indirect damages or for actions the app takes with your approval.</p>
          <h3>Contact</h3><p>Questions about these terms: <a href="mailto:apis.new.world@gmail.com">apis.new.world@gmail.com</a>.</p>`,
      },
    ],
  },
];
