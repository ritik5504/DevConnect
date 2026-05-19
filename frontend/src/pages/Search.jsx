import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import SearchBar from "../components/SearchBar";
import UserList from "../components/UserList";
import API from "../api/axios";

const Search = () => {
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [suggested, setSuggested] = useState([]);
  const [loadingSuggested, setLoadingSuggested] = useState(true);

  // Load suggested users on mount
  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get("/user/search?query=");
        setSuggested(res.data.users || []);
      } catch {
        /* ignore */
      } finally {
        setLoadingSuggested(false);
      }
    };
    load();
  }, []);

  const handleResults = (users, query) => {
    setResults(users);
    // Only mark as "searched" if user actually typed something
    setHasSearched(query !== undefined ? query.trim().length > 0 : users.length > 0);
  };

  return (
    <Layout>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>
            Discover Developers
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            Search by username or skill
          </p>
        </div>

        <div style={{ marginBottom: 28 }}>
          <SearchBar onResults={handleResults} placeholder="Search by username, React, Python..." />
        </div>

        {hasSearched ? (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 14 }}>
              {results.length} result{results.length !== 1 ? "s" : ""} found
            </h2>
            <UserList users={results} emptyMessage="No developers match your search" />
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 14 }}>
              Suggested Developers
            </h2>
            {loadingSuggested ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="card" style={{ display: "flex", gap: 14, alignItems: "center" }}>
                    <div className="skeleton" style={{ width: 48, height: 48, borderRadius: "50%" }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ width: "30%", height: 14, marginBottom: 6 }} />
                      <div className="skeleton" style={{ width: "60%", height: 12 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <UserList users={suggested} emptyMessage="No developers to suggest" />
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Search;
