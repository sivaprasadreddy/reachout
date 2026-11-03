# ReachOut

A mobile-friendly, accessible community profile directory built with **Hugo**. Profiles live in individual YAML files; no database, application server, or build-time npm dependencies are needed.

## Run locally

With [mise](https://mise.jdx.dev/) installed, set up the pinned Node.js, Hugo, and Python versions:

```sh
mise trust
mise install
mise run dev
```

Open <http://localhost:1313>.

- `mise run dev`: start the local server with live reload.
- `mise run build`: create the production site in `public/`, failing on Hugo warnings or invalid profiles.
- `mise run check`: build first, then check JavaScript syntax and generated pages, assets, and profile routes at the custom domain root (`/`).

Hugo’s cache stays in the ignored `.cache/hugo/` directory. No npm dependencies are required.

Without mise, install Hugo **0.169.0**, Node.js **24.22.0**, and Python **3.14.10**, then run `hugo server --cacheDir /tmp/reachout-hugo-cache --baseURL http://localhost:1313/`. To build and verify deployment under a repository subpath:

```sh
hugo --gc --minify --panicOnWarning --cacheDir /tmp/reachout-hugo-cache --baseURL https://example.org/reachout/
python3 scripts/check_site.py --base-path /reachout/
```

## Profiles and pull requests

Each file in `data/profiles/` creates a page at `/people/<filename>/`. The included nine profiles and their destinations are **fictional examples**; replace them with consenting community members before launch. Example social links point to platform homepages.

```yaml
# data/profiles/your-name.yaml
name: "Your Name"
role: "Designer & developer"
bio: "A few words about what you make and care about."
location: "Bengaluru, India"
category: "Development"
tags: ["Open source", "Accessibility"]
# Optional. Omit for an initial avatar, or add a file under static/images/.
avatar: "images/your-name.svg"
links:
  - label: "GitHub"
    url: "https://github.com/your-handle"
    icon: "github"
  - label: "My portfolio"
    url: "https://example.com"
    icon: "website"
```

Categories: `Design`, `Development`, `Writing`, `Photography`, `Music`, `Other`. Filenames must contain lowercase letters, digits, and single hyphens. The build rejects missing required fields, unsupported categories, missing avatar assets, and URLs without `http://` or `https://`.

1. Use **Create your profile** to generate YAML and open GitHub’s proposed-file flow, or fork this repository and add a YAML file directly.
2. Create a branch and pull request. Updates use **Suggest an edit** on a profile; copy the generated YAML into GitHub’s editor and propose changes.
3. GitHub Actions validates every PR. Review and merge it to `main` to publish.

The static form cannot authenticate or create PRs directly. It prepares the file and opens GitHub; the contributor completes GitHub’s fork/branch and PR flow. No token is stored in the browser. Locally, set `params.repository` in `hugo.yaml` to your full GitHub repository URL to enable the shortcut. Actions sets it automatically from `github.repository`.

To **require** PRs, configure a GitHub branch ruleset for `main`: require a pull request before merging and require the `build` status check. A repository administrator must enable this setting; a static website cannot enforce repository permissions.

## GitHub Pages deployment

Repository: [sivaprasadreddy/reachout](https://github.com/sivaprasadreddy/reachout). The intended public address is [reachout2me.online](https://reachout2me.online/). The existing [GitHub Pages address](https://sivaprasadreddy.github.io/reachout/) remains active until the custom-domain cutover is completed. For a new fork:

1. In **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source.
2. Enable a branch ruleset as described above.
3. Push or merge to `main`, or run **Validate and deploy ReachOut** manually.

The workflow verifies the Hugo release checksum, validates PRs without deployment privileges, and deploys merges to GitHub Pages using its generated base URL. Repository subpaths and custom domains are supported. PR code does not receive Pages write permissions. For a different default branch, update workflow branch conditions, `HUGO_PARAMS_BRANCH`, and `params.branch`.

Set `baseURL` in `hugo.yaml` if building outside Actions. No secrets are required for Pages deployment; GitHub supplies the scoped workflow token.

## Custom domain: reachout2me.online

Hugo’s production `baseURL` is `https://reachout2me.online/`. Local preview overrides it to localhost. The production check task and PR workflow validate URLs at the domain root.

### BigRock DNS

Open [BigRock’s dashboard](https://myorders.bigrock.in/dashboard), select **Orders → reachout2me.online → DNS Records**. Ensure the domain registration is active and its DNS service is enabled. If using BigRock’s Free DNS service, its default nameservers must be active: `dns1.bigrock.in`, `dns2.bigrock.in`, `dns3.bigrock.in`, and `dns4.bigrock.in`. Use the nameservers assigned by your DNS service if using Premium DNS instead.

Add these records (the apex host is `@`, or blank if BigRock’s form uses a blank host for the domain itself):

| Type | Host | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | sivaprasadreddy.github.io |

Use the default TTL. Replace conflicting parking records for these hosts; retain unrelated mail and verification records. The `www` CNAME points to the GitHub user domain without `/reachout/`.

### GitHub Pages cutover

After DNS resolves to GitHub Pages:

1. Open [repository Pages settings](https://github.com/sivaprasadreddy/reachout/settings/pages).
2. Save `reachout2me.online` under **Custom domain**.
3. Run **Validate and deploy ReachOut** on `main` to rebuild using the custom-domain URL returned by `actions/configure-pages`.
4. Once GitHub provisions the certificate, enable **Enforce HTTPS**.
5. Verify the home page, profile pages, search, social links, and the `www` redirect at the new domain.

This site deploys through a custom Actions workflow. GitHub ignores `CNAME` files for this publishing mode, so the repository’s Pages setting must be updated; adding a file alone does not activate the domain.

References: [BigRock DNS activation](https://www.bigrock.in/help/article/Go-to-the-DNS-panel), [BigRock record management](https://www.bigrock.in/help/article/How-to-add-DNS-records-under-the-BigRock-DNS-panel), [GitHub Pages custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Search and accessibility

Search is client-side and matches name, role, biography, location, tags, category, link labels, and URLs. Terms are case-insensitive and accent-insensitive; multiple terms all need to match. Category filters combine with search, sorting works in either direction, and search/filter state can be shared by URL. All profiles and links remain accessible without JavaScript.

The interface includes a skip link, semantic headings, visible keyboard focus, descriptive social link labels, live result announcements, reduced-motion support, and larger text and touch targets on mobile. No analytics, cookies, or account system are included.

## Assets and architecture

- `content/people/_content.gotmpl`: content adapter generating pages from YAML.
- `layouts/_partials/validate-profile.html`: build-time validation.
- `assets/js/main.js`: search, filtering, share link, and YAML contribution flow.
- `static/icons/`: vendored **Simple Icons 11.15.0** SVGs, including its CC0 license. Unknown/custom icon names fall back to a generic link symbol. Brand trademarks remain with their owners.
- `static/images/`: local illustrated example avatars.
- Typography: locally hosted DM Sans and Instrument Serif (SIL Open Font License), with system/Georgia fallbacks. No third-party font or image requests.
- `.github/workflows/pages.yaml`: PR validation and GitHub Pages deployment.
- `scripts/check_site.py`: generated route and local asset integration check.

Documentation consulted: [Hugo content adapters](https://gohugo.io/content-management/content-adapters/), [Hugo on GitHub Pages](https://gohugo.io/host-and-deploy/host-on-github-pages/), [Simple Icons](https://github.com/simple-icons/simple-icons).
