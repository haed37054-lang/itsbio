import Link from "next/link";
import type { CSSProperties } from "react";
import styles from "./BrandCategorySidebar.module.css";

export type BrandCategoryNode = {
  label: string;
  href: string;
  children?: readonly BrandCategoryNode[];
};

type Props = {
  brand: string;
  brandHref: string;
  nodes: readonly BrandCategoryNode[];
  activeHref: string;
  accent?: string;
  accentSoft?: string;
  accentBorder?: string;
};

function containsPage(node: BrandCategoryNode, activeHref: string): boolean {
  return node.href === activeHref || Boolean(node.children?.some((child) => containsPage(child, activeHref)));
}

function Arrow() {
  return <span className={styles.arrow} aria-hidden="true">›</span>;
}

function Flyout({ node, activeHref }: { node: BrandCategoryNode; activeHref: string }) {
  return (
    <div className={styles.flyout} data-sidebar-flyout={node.href}>
      <div className={styles.panel}>
        <div className={styles.panelTitle}>{node.label}</div>
        <ul className={styles.list}>
          {node.children?.map((child) => {
            const hasChildren = Boolean(child.children?.length);
            return (
              <li className={styles.row} key={child.href} data-sidebar-row={child.href}>
                <div className={styles.rowHead}>
                  <Link href={child.href} prefetch={false} aria-current={child.href === activeHref ? "page" : undefined} className={styles.link}>
                    {child.label}
                  </Link>
                  {hasChildren ? <Arrow /> : null}
                </div>
                {hasChildren ? <Flyout node={child} activeHref={activeHref} /> : null}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function TreeRows({ nodes, activeHref, depth = 0 }: { nodes: readonly BrandCategoryNode[]; activeHref: string; depth?: number }) {
  return (
    <ul className={depth ? styles.branch : styles.list}>
      {nodes.map((node) => {
        const hasChildren = Boolean(node.children?.length);
        const onTrail = containsPage(node, activeHref);
        const current = node.href === activeHref;
        return (
          <li key={node.href} className={styles.row} data-sidebar-row={node.href} data-active-trail={onTrail || undefined}>
            <div className={styles.rowHead}>
              <Link href={node.href} prefetch={false} aria-current={current ? "page" : undefined} className={styles.link}>
                {node.label}
              </Link>
              {hasChildren ? <Arrow /> : null}
            </div>
            {hasChildren && onTrail ? <TreeRows nodes={node.children!} activeHref={activeHref} depth={depth + 1} /> : null}
            {hasChildren && !onTrail ? <Flyout node={node} activeHref={activeHref} /> : null}
          </li>
        );
      })}
    </ul>
  );
}

export default function BrandCategorySidebar({
  brand, brandHref, nodes, activeHref,
  accent = "#61247b", accentSoft = "#f5f0fb", accentBorder = "#e9d5f5",
}: Props) {
  const theme = {
    "--sidebar-accent": accent,
    "--sidebar-soft": accentSoft,
    "--sidebar-border": accentBorder,
  } as CSSProperties;

  return (
    <aside className={styles.sidebar} style={theme}>
      <Link href={brandHref} prefetch={false} className={styles.brand}>{brand}</Link>
      <nav className={styles.navigation} aria-label={`${brand} product categories`}>
        <TreeRows nodes={nodes} activeHref={activeHref} />
      </nav>
    </aside>
  );
}
