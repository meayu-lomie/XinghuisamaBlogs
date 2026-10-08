import { siteConfig } from '../siteConfig';

/**
 * 站点页脚。
 *
 * 之前全站没有页脚：备案号（`icpConfig`）虽然写在 siteConfig 里，
 * 但没有任何地方渲染，等于白填。国内站点按规需要展示备案号，
 * 所以这里统一挂一个克制的页脚，同时把建站日期露出来。
 *
 * 备案号或链接为空时整段不渲染，避免留一个空框。
 */
export default function Footer() {
  const icp = siteConfig.icpConfig;
  const hasIcp = Boolean(icp?.name);
  const startYear = new Date(siteConfig.buildDate || Date.now()).getFullYear();
  const currentYear = new Date().getFullYear();
  const yearRange = currentYear > startYear ? `${startYear}–${currentYear}` : `${startYear}`;

  return (
    <footer className="relative z-10 mt-auto border-t border-[var(--rule)]">
      <div className="w-[95%] md:w-[90%] max-w-6xl mx-auto py-8 flex flex-col items-center gap-2 text-center">
        <p className="text-xs text-[var(--ink-faint)] font-medium">
          © {yearRange} {siteConfig.authorName}
        </p>
        {hasIcp && (
          <a
            href={icp.link || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--ink-faint)] hover:text-[var(--accent)] transition-colors"
          >
            {icp.name}
          </a>
        )}
      </div>
    </footer>
  );
}
