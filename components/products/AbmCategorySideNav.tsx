import Link from "next/link";
import { ABM_SERVICE_GROUPS } from "@/lib/abm/catalog-taxonomy";
import { findTreeNodeByPath, type CatLite, type TreeNode } from "@/lib/abm/sidebar-tree";
type SidebarTheme = { accentText: string; accentActiveBg: string; accentActiveText: string; accentSoftBg: string };
const KENT_MENU_TITLE = "General Lab Equipment";
function buildHref(brandKey: string, path: string[]) {
  return path.length ? `/products/${brandKey}/${path.join("/")}` : `/products/${brandKey}`;
}

function humanizeSegment(seg: string) {
  if (seg === "RNAi-shRNA-sirna-shrna-rnai-lentivirus") return "siRNA";
  return (seg || "").replaceAll("-", " ").replaceAll("_", " ").trim();
}

function decodeHtmlEntities(input: string) {
  if (!input) return "";
  return input
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&#x27;", "'")
    .replaceAll("&nbsp;", " ");
}

function stripBrandSuffix(title: string) {
  const raw = decodeHtmlEntities((title || "").trim());
  const idx = raw.indexOf("|");
  return (idx >= 0 ? raw.slice(0, idx) : raw).trim();
}

export default function AbmCategorySideNav({
  brandKey,
  roots,
  activePath,
  activeRootTree,
  theme,
  isKentMode,
}: {
  brandKey: string;
  roots: CatLite[];
  activePath: string[];
  activeRootTree: TreeNode[];
  theme: SidebarTheme;
  isKentMode: boolean;
}) {
  const activePathStr = activePath.join("/");
  const activeRoot = activePath[0] || "";

  const activeRootTitle = isKentMode
    ? KENT_MENU_TITLE
    : roots.find((r) => (r.path?.[0] || "") === activeRoot)?.title ||
      (activeRoot ? humanizeSegment(activeRoot) : "All Products");

  const isPrefix = (full: string, prefix: string) => full === prefix || full.startsWith(prefix + "/");

  function nodeHref(n: { path: string[] }) {
    return buildHref(brandKey, n.path);
  }

  function FlyoutRows({ nodes, parentTitle }: { nodes: TreeNode[]; parentTitle?: string }) {
    if (!nodes.length) return null;

    return (
      <div className="w-[264px] overflow-visible rounded-xl border border-orange-200 bg-white p-1.5 shadow-[0_18px_44px_rgba(15,23,42,0.22)]">
        {parentTitle ? (
          <div className="-mx-1.5 -mt-1.5 mb-1.5 rounded-t-xl bg-orange-500 px-4 py-2.5 text-[12px] font-bold tracking-[0.04em] text-white">
            {stripBrandSuffix(parentTitle)}
          </div>
        ) : null}
        <div className="space-y-0.5">
          {nodes.map((node) => {
            const nodePath = node.path.join("/");
            const isActive = activePathStr === nodePath;
            const isOnTrail = (isPrefix(activePathStr, nodePath) || Boolean(findTreeNodeByPath(node.children, activePath))) && !isActive;
            const hasChildren = node.children.length > 0;

            return (
              <div key={node.key} className="group/flyout relative">
                <Link
                  href={nodeHref(node)}
                  aria-current={isActive ? "page" : undefined}
                  prefetch={false}
                  className={[
                    "flex min-h-9 items-center justify-between gap-3 rounded-lg px-3 py-2 text-[13px] leading-5 transition",
                    isActive
                      ? `${theme.accentActiveBg} ${theme.accentActiveText} font-semibold`
                      : isOnTrail
                        ? `${theme.accentSoftBg} ${theme.accentText} font-semibold`
                        : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950",
                  ].join(" ")}
                >
                  <span className="min-w-0 whitespace-normal">{stripBrandSuffix(node.title)}</span>
                  {hasChildren ? (
                    <span className={`${theme.accentText} shrink-0`} aria-hidden>›</span>
                  ) : null}
                </Link>

                {hasChildren ? (
                  <div className="absolute left-full top-0 z-[140] hidden pl-2 lg:group-hover/flyout:block">
                    <FlyoutRows nodes={node.children} parentTitle={node.title} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function TreeRows({ nodes, depth = 0 }: { nodes: TreeNode[]; depth?: number }) {
    if (!nodes.length) return null;

    return (
      <div className={depth ? "ml-4 space-y-0.5 border-l border-dashed border-orange-200 pl-3" : "space-y-1"}>
        {nodes.map((node) => {
          const nodePath = node.path.join("/");
          const isActive = activePathStr === nodePath;
          const isOnTrail = (isPrefix(activePathStr, nodePath) || Boolean(findTreeNodeByPath(node.children, activePath))) && !isActive;
          const hasChildren = node.children.length > 0;
          const isOpen = hasChildren && (isActive || isOnTrail);

          return (
            <div key={node.key} className="group/tree-row relative">
              <Link
                href={nodeHref(node)}
                  aria-current={isActive ? "page" : undefined}
                prefetch={false}
                className={[
                  "group flex min-h-10 items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[13px] leading-5 transition",
                  isActive
                    ? `${theme.accentActiveBg} ${theme.accentActiveText} font-semibold`
                    : isOnTrail
                      ? `${theme.accentSoftBg} ${theme.accentText} font-semibold`
                      : "text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950",
                ].join(" ")}
              >
                <span className="min-w-0 whitespace-normal">{stripBrandSuffix(node.title)}</span>
                {hasChildren ? (
                  <span className={`${isOpen ? theme.accentText : "text-neutral-300 group-hover:text-neutral-500"} shrink-0`} aria-hidden>
                    {isOpen ? "⌃" : <span className="hidden lg:inline">›</span>}
                    {!isOpen ? <span className="lg:hidden">⌄</span> : null}
                  </span>
                ) : (
                  <span className="shrink-0 text-neutral-300 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden>›</span>
                )}
              </Link>

              {isOpen ? <TreeRows nodes={node.children} depth={depth + 1} /> : null}

              {hasChildren && !isOpen ? (
                <div className="absolute left-full top-0 z-[130] hidden pl-2 lg:group-hover/tree-row:block">
                  <FlyoutRows nodes={node.children} parentTitle={node.title} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className={`border-b border-orange-100 ${isKentMode ? "bg-blue-50" : "bg-orange-50"} px-5 py-4`}>
        <div className={`text-base font-semibold ${theme.accentText}`}>{isKentMode ? stripBrandSuffix(activeRootTitle) : "All Products"}</div>
      </div>

      <nav className="max-h-[calc(100vh-170px)] overflow-y-auto p-2 lg:max-h-none lg:overflow-visible" aria-label="Product categories">
        {!isKentMode && activeRoot ? (
          <div className="mb-1">
            <Link href={buildHref(brandKey, [activeRoot])} prefetch={false} className="flex min-h-10 items-center rounded-xl bg-orange-50 px-3 py-2.5 text-[13px] font-semibold text-[#dc5a2b]">
              <span>{stripBrandSuffix(activeRootTitle)}</span>
            </Link>
          </div>
        ) : null}

        <div>
          {activeRootTree?.length ? (
            <TreeRows nodes={activeRootTree} />
          ) : (
            !activeRoot ? roots.map((root) => (
              <Link key={root._id} href={buildHref(brandKey, root.path)} prefetch={true} className="flex min-h-10 items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-[#dc5a2b]">
                <span>{stripBrandSuffix(root.title)}</span><span aria-hidden>{isKentMode ? "⌄" : "›"}</span>
              </Link>
            )) : null
          )}
        </div>

        {!isKentMode && activeRoot ? (
          <div className="mt-2 border-t border-slate-200 pt-2">
            {roots.filter((root) => root.path?.[0] !== activeRoot).map((root) => (
                <Link
                  key={root._id}
                  href={buildHref(brandKey, root.path)}
                  prefetch={true}
                  className="flex min-h-10 items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-[#dc5a2b]"
                >
                  <span className="min-w-0 truncate">{stripBrandSuffix(root.title)}</span>
                  <span aria-hidden>›</span>
                </Link>
            ))}
          </div>
        ) : null}

        {!isKentMode ? (
          <div className="mt-3 border-t border-slate-200 pt-3">
            <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Services</div>
            {ABM_SERVICE_GROUPS.map((group) => (
              <Link
                key={group.slug}
                href={group.href}
                prefetch={true}
                className="flex min-h-10 items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-[#dc5a2b]"
              >
                <span>{group.title}</span>
                <span className="text-neutral-300" aria-hidden>›</span>
              </Link>
            ))}
          </div>
        ) : null}
      </nav>
    </div>
  );
}

