import { useMemo } from "react";
import { Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCampus } from "../context/CampusContext";
import { searchCampus } from "../services/studentData";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";

const types = ["task", "course", "announcement", "resource"];

export default function GlobalSearch() {
  const { t } = useTranslation();
  const { search } = useLocation();
  const query = new URLSearchParams(search).get("q") || "";
  const data = useCampus();
  const results = useMemo(() => searchCampus(query, data), [query, data]);

  return (
    <div className="module-page">
      <PageHeader
        eyebrow={t("globalSearch.eyebrow")}
        title={t("globalSearch.title")}
        subtitle={t("globalSearch.resultsFor", { query, count: results.length })}
      />
      {results.length ? (
        <div className="search-result-groups">
          {types.map((type) => {
            const items = results.filter((item) => item.type === type);
            if (!items.length) return null;
            return (
              <section className="panel search-result-group" key={type}>
                <h2>{t(`globalSearch.types.${type}`)}</h2>
                {items.map((item) => (
                  <Link className="search-result" to={item.href} key={item.id}>
                    <Search size={16} />
                    <span>{item.title}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                ))}
              </section>
            );
          })}
        </div>
      ) : (
        <section className="panel">
          <EmptyState
            title={t("globalSearch.emptyTitle")}
            message={t("globalSearch.emptyMessage")}
          />
        </section>
      )}
    </div>
  );
}
