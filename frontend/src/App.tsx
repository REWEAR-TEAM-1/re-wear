import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  Check,
  Heart,
  Leaf,
  LoaderCircle,
  MapPin,
  Plus,
  Search,
  Shirt,
  Sparkles,
  X,
} from "lucide-react";
import { createListing, getListings } from "./api";
import { recommendListings, type MatchPreferences } from "./recommendations";
import {
  categories,
  conditions,
  type Listing,
  type ListingCategory,
  type ListingDraft,
  type ListingType,
} from "./types";

type CatalogTab = "ALL" | ListingType;

const categoryLabels: Record<ListingCategory, string> = {
  TOPS: "Tops",
  BOTTOMS: "Bottoms",
  DRESSES: "Dresses",
  OUTERWEAR: "Outerwear",
  ACCESSORIES: "Accessories",
};

const conditionLabels: Record<Listing["condition"], string> = {
  NEW: "New with tags",
  LIKE_NEW: "Like new",
  GOOD: "Good",
  REWORKABLE: "Ready to rework",
};

const emptyDraft: ListingDraft = {
  title: "",
  description: "",
  sellerName: "",
  category: "TOPS",
  size: "M",
  condition: "GOOD",
  price: 15000,
  type: "SALE",
  imageUrl: "",
  location: "Seoul",
};

const priceFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

function readSavedIds(): number[] {
  try {
    const saved = window.localStorage.getItem("rewear:saved");
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) && parsed.every((id) => Number.isInteger(id)) ? parsed : [];
  } catch {
    return [];
  }
}

function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ListingCategory | "">("");
  const [size, setSize] = useState("");
  const [tab, setTab] = useState<CatalogTab>("ALL");
  const [savedIds, setSavedIds] = useState<number[]>(readSavedIds);
  const [savedOnly, setSavedOnly] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [matchCategory, setMatchCategory] = useState<ListingCategory | "">("");
  const [matchSize, setMatchSize] = useState("");
  const [matchPreferences, setMatchPreferences] = useState<MatchPreferences>({ category: "", size: "" });
  const [matchMode, setMatchMode] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  async function loadListings() {
    setLoading(true);
    setError("");
    try {
      setListings(await getListings());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The catalog could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadListings();
  }, []);

  useEffect(() => {
    window.localStorage.setItem("rewear:saved", JSON.stringify(savedIds));
  }, [savedIds]);

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const base = listings.filter((listing) => {
      const matchesTab = tab === "ALL" || listing.type === tab;
      const matchesCategory = !category || listing.category === category;
      const matchesSize = !size || listing.size.toLowerCase() === size.toLowerCase()
        || listing.size.toLowerCase() === "custom";
      const matchesQuery = !normalizedQuery
        || `${listing.title} ${listing.description} ${listing.sellerName} ${listing.location}`
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesSaved = !savedOnly || savedIds.includes(listing.id);
      return matchesTab && matchesCategory && matchesSize && matchesQuery && matchesSaved;
    });

    return matchMode ? recommendListings(base, matchPreferences) : base;
  }, [category, listings, matchMode, matchPreferences, query, savedIds, savedOnly, size, tab]);

  function toggleSaved(id: number) {
    setSavedIds((current) => current.includes(id)
      ? current.filter((savedId) => savedId !== id)
      : [...current, id]);
  }

  function applyMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMatchPreferences({ category: matchCategory, size: matchSize });
    setMatchMode(true);
    setSavedOnly(false);
    setShowMatch(false);
    document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" });
  }

  function clearFilters() {
    setQuery("");
    setCategory("");
    setSize("");
    setTab("ALL");
    setSavedOnly(false);
    setMatchMode(false);
  }

  const featuredListing = listings.find((listing) => listing.type === "SALE") ?? listings[0];

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="RE:WEAR home">
          <span className="brand-mark"><Leaf size={18} strokeWidth={2.2} /></span>
          <span>re<span className="brand-colon">:</span>wear</span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a className="nav-active" href="#discover">Discover</a>
          <a href="#how-it-works">Our impact</a>
        </nav>
        <div className="header-actions">
          <button
            className={`saved-nav ${savedOnly ? "saved-nav-active" : ""}`}
            onClick={() => {
              setSavedOnly((current) => !current);
              setMatchMode(false);
              document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" });
            }}
            type="button"
          >
            <Heart size={16} fill={savedOnly ? "currentColor" : "none"} />
            <span>Saved</span>
            {savedIds.length > 0 && <span className="saved-count">{savedIds.length}</span>}
          </button>
          <button className="button button-dark button-small" onClick={() => setCreateOpen(true)} type="button">
            <Plus size={16} /> List an item
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero page-width">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> A more thoughtful way to dress</p>
            <h1>Good things<br />deserve <em>another</em> life.</h1>
            <p className="hero-description">
              Find a piece to love, pass one along, or give something old a beautiful new shape.
            </p>
            <div className="hero-actions">
              <a className="button button-dark" href="#discover">Explore the edit <ArrowRight size={17} /></a>
              <button className="text-button" onClick={() => setCreateOpen(true)} type="button">
                Share your wardrobe <ArrowDownRight size={16} />
              </button>
            </div>
            <div className="hero-note">
              <div className="avatar-stack" aria-hidden="true">
                <span>M</span><span>J</span><span>S</span>
              </div>
              <p><strong>Small choices, softer footprint.</strong><br />A community for clothes worth keeping.</p>
            </div>
          </div>
          <div className="hero-visual">
            <img
              className="hero-image"
              src={featuredListing?.imageUrl ?? "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85"}
              alt="A thoughtfully styled second-hand outfit"
            />
            <div className="hero-image-wash" />
            <div className="hero-image-label">
              <span className="label-icon"><Leaf size={15} /></span>
              <span><strong>Wear it well.</strong><small>Pass it on.</small></span>
            </div>
            <div className="hero-sticker">
              <span>GOOD</span><span>THINGS</span><span>GO AROUND</span>
              <ArrowDownRight size={17} />
            </div>
            <span className="hero-caption">01 / GIVE CLOTHES A SECOND STORY</span>
          </div>
        </section>

        <section className="ticker" aria-label="Our values">
          <div className="ticker-track">
            {Array.from({ length: 2 }, (_, row) => (
              <span className="ticker-row" key={row}>
                <span>REDUCE</span><Leaf size={15} /><span>REUSE</span><Leaf size={15} />
                <span>REDESIGN</span><Leaf size={15} /><span>REPEAT</span><Leaf size={15} />
                <span>REDUCE</span><Leaf size={15} /><span>REUSE</span><Leaf size={15} />
                <span>REDESIGN</span><Leaf size={15} /><Leaf size={15} />
              </span>
            ))}
          </div>
        </section>

        <section className="catalog-section page-width" id="discover">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE RE:WEAR EDIT</p>
              <h2>Find your next <em>favorite.</em></h2>
            </div>
            <p className="section-aside">Pre-loved pieces and one-of-a-kind<br />redesigns, ready for a new chapter.</p>
          </div>

          <div className="catalog-toolbar">
            <div className="catalog-tabs" role="tablist" aria-label="Listing type">
              {([
                ["ALL", "Everything"],
                ["SALE", "Pre-loved"],
                ["REDESIGN", "Redesign"],
              ] as const).map(([value, label]) => (
                <button
                  aria-selected={tab === value}
                  className={tab === value ? "catalog-tab tab-active" : "catalog-tab"}
                  key={value}
                  onClick={() => setTab(value)}
                  role="tab"
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="filter-controls">
              <label className="search-field">
                <Search size={16} />
                <input
                  aria-label="Search listings"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search the edit"
                  value={query}
                />
              </label>
              <label className="select-field">
                <span className="sr-only">Filter by category</span>
                <select value={category} onChange={(event) => setCategory(event.target.value as ListingCategory | "")}>
                  <option value="">All categories</option>
                  {categories.map((item) => <option key={item} value={item}>{categoryLabels[item]}</option>)}
                </select>
              </label>
              <label className="select-field size-filter">
                <span className="sr-only">Filter by size</span>
                <select value={size} onChange={(event) => setSize(event.target.value)}>
                  <option value="">Any size</option>
                  {["XS", "S", "M", "L", "XL", "Custom"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <button
                className={`match-button ${matchMode ? "match-active" : ""}`}
                onClick={() => setShowMatch((current) => !current)}
                type="button"
              >
                <Sparkles size={16} /> Match me
              </button>
            </div>
          </div>

          {showMatch && (
            <form className="match-panel" onSubmit={applyMatch}>
              <div className="match-panel-copy">
                <span className="match-icon"><Sparkles size={17} /></span>
                <span><strong>Find a better fit.</strong><small>Our matching prototype ranks pieces by your style and size.</small></span>
              </div>
              <label>
                <span>I'm looking for</span>
                <select value={matchCategory} onChange={(event) => setMatchCategory(event.target.value as ListingCategory | "")}>
                  <option value="">Any category</option>
                  {categories.map((item) => <option key={item} value={item}>{categoryLabels[item]}</option>)}
                </select>
              </label>
              <label>
                <span>My size</span>
                <select value={matchSize} onChange={(event) => setMatchSize(event.target.value)}>
                  <option value="">Any size</option>
                  {["XS", "S", "M", "L", "XL"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <button className="button button-dark button-small" disabled={!matchCategory && !matchSize} type="submit">
                Show my matches <ArrowRight size={15} />
              </button>
            </form>
          )}

          {error && (
            <div className="notice notice-error" role="alert">
              <div><strong>We couldn't reach the RE:WEAR catalog.</strong><p>{error}</p></div>
              <button className="text-button" onClick={() => void loadListings()} type="button">Try again</button>
            </div>
          )}

          {loading ? (
            <div className="catalog-status"><LoaderCircle className="spin" size={24} /><span>Gathering good finds...</span></div>
          ) : !error && filteredListings.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon"><Shirt size={23} /></span>
              <h3>{matchMode ? "No close matches just yet." : savedOnly ? "Your saved edit is waiting." : "Nothing in this edit yet."}</h3>
              <p>{matchMode ? "Try another size or category, or browse all current finds." : savedOnly ? "Tap the heart on a listing to keep it close." : "Be the first to give a good piece a new home."}</p>
              <button className="text-button" onClick={clearFilters} type="button">Show me everything <ArrowRight size={15} /></button>
            </div>
          ) : (
            <>
              <div className="results-meta">
                <span>{savedOnly ? "YOUR SAVED EDIT" : matchMode ? "YOUR MATCHES" : "FRESHLY FOUND"} <b>{filteredListings.length}</b></span>
                {matchMode && <button className="clear-match" onClick={() => setMatchMode(false)} type="button">Clear matches <X size={13} /></button>}
              </div>
              <div className="listing-grid">
                {filteredListings.map((listing, index) => (
                  <ListingCard
                    isSaved={savedIds.includes(listing.id)}
                    key={listing.id}
                    listing={listing}
                    matchScore={matchMode ? (listing.category === matchPreferences.category ? 2 : 0)
                      + (listing.size.toLowerCase() === matchPreferences.size.toLowerCase() ? 2 : listing.size.toLowerCase() === "custom" ? 1 : 0) : 0}
                    onOpen={() => setSelectedListing(listing)}
                    onToggleSaved={() => toggleSaved(listing.id)}
                    priority={index < 3}
                  />
                ))}
              </div>
            </>
          )}

          <div className="catalog-footnote">
            <span><Leaf size={15} /> Every piece is a choice to keep good clothes in motion.</span>
            <button className="text-button" onClick={() => setCreateOpen(true)} type="button">Have something to share? <ArrowRight size={15} /></button>
          </div>
        </section>

        <section className="impact-section" id="how-it-works">
          <div className="impact-content page-width">
            <div className="impact-copy">
              <p className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> THE CIRCLE OF GOOD</p>
              <h2>Less new.<br /><em>More you.</em></h2>
              <p>RE:WEAR brings people who love clothes together with the people who can love them next — or make them feel brand new again.</p>
              <a className="button button-light" href="#discover">Explore the community <ArrowRight size={16} /></a>
            </div>
            <div className="impact-steps">
              <div className="impact-step"><span>01</span><div><h3>Find a piece</h3><p>Discover pre-loved clothes with a story, a style, and a little more life in them.</p></div><Shirt size={20} /></div>
              <div className="impact-step"><span>02</span><div><h3>Pass it along</h3><p>Give your closet a refresh and let someone else fall for what you already love.</p></div><ArrowRight size={20} /></div>
              <div className="impact-step"><span>03</span><div><h3>Make it new</h3><p>Meet a local designer and turn a well-worn favorite into something only you own.</p></div><Sparkles size={20} /></div>
            </div>
          </div>
          <span className="impact-decoration" aria-hidden="true">RE:USE</span>
        </section>
      </main>

      <footer className="site-footer page-width">
        <a className="brand" href="#top"><span className="brand-mark"><Leaf size={17} /></span><span>re<span className="brand-colon">:</span>wear</span></a>
        <p>Good things, worn again. <span>© 2026 RE:WEAR</span></p>
        <a href="#top" className="footer-top">Back to top <ArrowDownRight size={14} /></a>
      </footer>

      {createOpen && <CreateListingDialog onClose={() => setCreateOpen(false)} onCreated={(listing) => {
        setListings((current) => [listing, ...current]);
        setCreateOpen(false);
        setTab("ALL");
        setCategory("");
        setSize("");
        setSavedOnly(false);
        setMatchMode(false);
        setError("");
      }} />}
      {selectedListing && (
        <ListingDetailsDialog
          isSaved={savedIds.includes(selectedListing.id)}
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onToggleSaved={() => toggleSaved(selectedListing.id)}
        />
      )}
    </div>
  );
}

function ListingCard({
  listing,
  isSaved,
  matchScore,
  priority,
  onOpen,
  onToggleSaved,
}: {
  listing: Listing;
  isSaved: boolean;
  matchScore: number;
  priority: boolean;
  onOpen: () => void;
  onToggleSaved: () => void;
}) {
  return (
    <article className="listing-card">
      <div className="listing-image-wrap">
        <button className="listing-image-button" onClick={onOpen} type="button" aria-label={`View ${listing.title}`}>
          {listing.imageUrl
            ? <img alt="" className="listing-image" loading={priority ? "eager" : "lazy"} src={listing.imageUrl} />
            : <span className="image-placeholder"><Shirt size={34} /></span>}
        </button>
        <span className={`listing-type ${listing.type === "REDESIGN" ? "type-redesign" : ""}`}>
          {listing.type === "REDESIGN" ? "Designer service" : "Pre-loved"}
        </span>
        <button
          aria-label={isSaved ? "Remove from saved" : "Save listing"}
          aria-pressed={isSaved}
          className={`favorite-button ${isSaved ? "favorite-active" : ""}`}
          onClick={onToggleSaved}
          type="button"
        >
          <Heart size={17} fill={isSaved ? "currentColor" : "none"} />
        </button>
        {matchScore > 0 && <span className="match-score"><Sparkles size={12} /> {matchScore * 25}% fit</span>}
      </div>
      <div className="listing-info">
        <div className="listing-kicker"><span>{categoryLabels[listing.category]}</span><span>{conditionLabels[listing.condition]}</span></div>
        <button className="listing-title" onClick={onOpen} type="button">{listing.title}</button>
        <div className="listing-meta"><span>Size {listing.size}</span><span className="meta-dot" /><span><MapPin size={12} /> {listing.location}</span></div>
        <div className="listing-bottom"><span className="listing-price">{priceFormatter.format(listing.price)}</span><span className="listing-seller">by {listing.sellerName}</span></div>
      </div>
    </article>
  );
}

function CreateListingDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (listing: Listing) => void }) {
  const [draft, setDraft] = useState<ListingDraft>(emptyDraft);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  function updateDraft<Key extends keyof ListingDraft>(key: Key, value: ListingDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const listing = await createListing(draft);
      onCreated(listing);
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : "Your listing could not be saved.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section aria-labelledby="create-title" aria-modal="true" className="dialog-card create-dialog" role="dialog">
        <div className="dialog-header">
          <div><p className="eyebrow">PASS IT ON</p><h2 id="create-title">Share something <em>good.</em></h2></div>
          <button aria-label="Close dialog" className="dialog-close" onClick={onClose} type="button"><X size={19} /></button>
        </div>
        <p className="dialog-intro">List a piece from your closet or offer your redesign skills to the community.</p>
        <form className="listing-form" onSubmit={handleSubmit}>
          <label className="form-wide">I'm here to
            <select onChange={(event) => updateDraft("type", event.target.value as ListingType)} value={draft.type}>
              <option value="SALE">Pass along a piece</option>
              <option value="REDESIGN">Offer a redesign service</option>
            </select>
          </label>
          <label className="form-wide">Listing title
            <input maxLength={120} onChange={(event) => updateDraft("title", event.target.value)} placeholder="e.g. Linen jacket, ready for spring" required value={draft.title} />
          </label>
          <label>Description
            <textarea maxLength={1000} onChange={(event) => updateDraft("description", event.target.value)} placeholder="Tell us what makes it special..." required rows={3} value={draft.description} />
          </label>
          <label>Price (KRW)
            <input min="0" onChange={(event) => updateDraft("price", Number(event.target.value))} required step="1000" type="number" value={draft.price} />
          </label>
          <label>Your name
            <input maxLength={80} onChange={(event) => updateDraft("sellerName", event.target.value)} placeholder="Name or studio" required value={draft.sellerName} />
          </label>
          <label>Category
            <select onChange={(event) => updateDraft("category", event.target.value as ListingCategory)} value={draft.category}>
              {categories.map((item) => <option key={item} value={item}>{categoryLabels[item]}</option>)}
            </select>
          </label>
          <label>Size
            <input maxLength={16} onChange={(event) => updateDraft("size", event.target.value)} placeholder="M or Custom" required value={draft.size} />
          </label>
          <label>Condition
            <select onChange={(event) => updateDraft("condition", event.target.value as Listing["condition"])} value={draft.condition}>
              {conditions.map((item) => <option key={item} value={item}>{conditionLabels[item]}</option>)}
            </select>
          </label>
          <label>Location
            <input maxLength={100} onChange={(event) => updateDraft("location", event.target.value)} required value={draft.location} />
          </label>
          <label className="form-wide">Photo URL <span className="optional-label">optional</span>
            <input maxLength={2048} onChange={(event) => updateDraft("imageUrl", event.target.value)} placeholder="https://..." type="url" value={draft.imageUrl} />
          </label>
          {formError && <p className="form-error form-wide" role="alert">{formError}</p>}
          <button className="button button-dark form-wide submit-button" disabled={submitting} type="submit">
            {submitting ? <><LoaderCircle className="spin" size={17} /> Saving your listing...</> : <>Add to the edit <ArrowRight size={16} /></>}
          </button>
        </form>
      </section>
    </div>
  );
}

function ListingDetailsDialog({
  listing,
  isSaved,
  onClose,
  onToggleSaved,
}: {
  listing: Listing;
  isSaved: boolean;
  onClose: () => void;
  onToggleSaved: () => void;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section aria-labelledby="details-title" aria-modal="true" className="dialog-card details-dialog" role="dialog">
        <button aria-label="Close dialog" className="dialog-close details-close" onClick={onClose} type="button"><X size={19} /></button>
        <div className="details-image">
          {listing.imageUrl ? <img alt="" src={listing.imageUrl} /> : <span className="image-placeholder"><Shirt size={36} /></span>}
          <span className={`listing-type ${listing.type === "REDESIGN" ? "type-redesign" : ""}`}>
            {listing.type === "REDESIGN" ? "Designer service" : "Pre-loved"}
          </span>
        </div>
        <div className="details-copy">
          <p className="eyebrow">{categoryLabels[listing.category]} · {conditionLabels[listing.condition]}</p>
          <h2 id="details-title">{listing.title}</h2>
          <p className="details-description">{listing.description}</p>
          <div className="details-meta"><span>Size {listing.size}</span><span><MapPin size={14} /> {listing.location}</span><span>By {listing.sellerName}</span></div>
          <div className="details-bottom">
            <strong>{priceFormatter.format(listing.price)}</strong>
            <button className={`button ${isSaved ? "button-saved" : "button-dark"}`} onClick={onToggleSaved} type="button">
              {isSaved ? <><Check size={16} /> Saved to your edit</> : <><Heart size={16} /> Save for later</>}
            </button>
          </div>
          <p className="contact-note">Interested? Save this find and connect with {listing.sellerName} through the RE:WEAR community.</p>
        </div>
      </section>
    </div>
  );
}

export default App;
