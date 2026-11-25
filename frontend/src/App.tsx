import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
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
import { createListing, getListings, resolveImageUrl, uploadImage } from "./api";
import { recommendListings, type MatchPreferences } from "./recommendations";
import {
  categories,
  conditions,
  type Listing,
  type ListingCategory,
  type ListingDraft,
  type ListingType,
} from "./types";
import {
  languageLocales,
  languageNames,
  languages,
  parseLanguage,
  translations,
  type Language,
} from "./i18n";

type CatalogTab = "ALL" | ListingType;

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

function formatPrice(value: number, language: Language): string {
  return new Intl.NumberFormat(languageLocales[language], {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

function getErrorMessage(error: unknown, fallback: string, networkError: string): string {
  if (!(error instanceof Error) || !error.message) {
    return fallback;
  }
  return ["Failed to fetch", "Load failed"].includes(error.message) ? networkError : error.message;
}

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
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return parseLanguage(window.localStorage.getItem("rewear:language"));
    } catch {
      return "en";
    }
  });
  const t = translations[language];
  const categoryLabels: Record<ListingCategory, string> = {
    TOPS: t.categoryTops,
    BOTTOMS: t.categoryBottoms,
    DRESSES: t.categoryDresses,
    OUTERWEAR: t.categoryOuterwear,
    ACCESSORIES: t.categoryAccessories,
  };
  const conditionLabels: Record<Listing["condition"], string> = {
    NEW: t.newWithTags,
    LIKE_NEW: t.likeNew,
    GOOD: t.goodCondition,
    REWORKABLE: t.readyToRework,
  };
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
      setError(getErrorMessage(loadError, t.listingLoadFailed, t.networkError));
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

  useEffect(() => {
    window.localStorage.setItem("rewear:language", language);
    document.documentElement.lang = languageLocales[language];
    document.title = t.pageTitle;
    document.querySelector('meta[name="description"]')?.setAttribute("content", t.pageDescription);
  }, [language, t]);

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
        <a className="brand" href="#top" aria-label={t.siteHome}>
          <span className="brand-mark"><Leaf size={18} strokeWidth={2.2} /></span>
          <span>re<span className="brand-colon">:</span>wear</span>
        </a>
        <nav className="main-nav" aria-label={t.mainNavigation}>
          <a className="nav-active" href="#discover">{t.discover}</a>
          <a href="#how-it-works">{t.impact}</a>
        </nav>
        <div className="header-actions">
          <label className="language-control">
            <span className="sr-only">{t.language}</span>
            <select
              aria-label={t.language}
              onChange={(event) => setLanguage(parseLanguage(event.target.value))}
              value={language}
            >
              {languages.map((option) => (
                <option key={option} value={option}>{languageNames[option]}</option>
              ))}
            </select>
          </label>
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
            <span>{t.saved}</span>
            {savedIds.length > 0 && <span className="saved-count">{savedIds.length}</span>}
          </button>
          <button className="button button-dark button-small" onClick={() => setCreateOpen(true)} type="button">
            <Plus size={16} /> {t.listItem}
          </button>
        </div>
      </header>

      <main id="top">
        <section className="hero page-width">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> {t.heroEyebrow}</p>
            <h1>{t.heroTitle}<br /><em>{t.heroTitleEmphasis}</em></h1>
            <p className="hero-description">
              {t.heroDescription}
            </p>
            <div className="hero-actions">
              <a className="button button-dark" href="#discover">{t.exploreEdit} <ArrowRight size={17} /></a>
              <button className="text-button" onClick={() => setCreateOpen(true)} type="button">
                {t.shareWardrobe} <ArrowDownRight size={16} />
              </button>
            </div>
            <div className="hero-note">
              <div className="avatar-stack" aria-hidden="true">
                <span>M</span><span>J</span><span>S</span>
              </div>
              <p><strong>{t.smallChoices}</strong><br />{t.communityTagline}</p>
            </div>
          </div>
          <div className="hero-visual">
            <img
              className="hero-image"
              src={resolveImageUrl(featuredListing?.imageUrl ?? null) ?? "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85"}
              alt={t.heroImageAlt}
            />
            <div className="hero-image-wash" />
            <div className="hero-image-label">
              <span className="label-icon"><Leaf size={15} /></span>
              <span><strong>{t.wearItWell}</strong><small>{t.passItOn}</small></span>
            </div>
            <div className="hero-sticker">
              <span>{t.goodThings}</span><span>{t.things}</span><span>{t.goAround}</span>
              <ArrowDownRight size={17} />
            </div>
            <span className="hero-caption">{t.heroCaption}</span>
          </div>
        </section>

        <section className="ticker" aria-label={t.ourValues}>
          <div className="ticker-track">
            {Array.from({ length: 2 }, (_, row) => (
              <span className="ticker-row" key={row}>
                <span>{t.reduce}</span><Leaf size={15} /><span>{t.reuse}</span><Leaf size={15} />
                <span>{t.redesign}</span><Leaf size={15} /><span>{t.repeat}</span><Leaf size={15} />
                <span>{t.reduce}</span><Leaf size={15} /><span>{t.reuse}</span><Leaf size={15} />
                <span>{t.redesign}</span><Leaf size={15} /><Leaf size={15} />
              </span>
            ))}
          </div>
        </section>

        <section className="catalog-section page-width" id="discover">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{t.catalogEyebrow}</p>
              <h2>{t.catalogTitle} <em>{t.catalogTitleEmphasis}</em></h2>
            </div>
            <p className="section-aside">{t.catalogAside}</p>
          </div>

          <div className="catalog-toolbar">
            <div className="catalog-tabs" role="tablist" aria-label={t.listingType}>
              {([
                ["ALL", t.everything],
                ["SALE", t.tabSale],
                ["REDESIGN", t.tabRedesign],
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
                  aria-label={t.searchListings}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t.searchPlaceholder}
                  value={query}
                />
              </label>
              <label className="select-field">
                <span className="sr-only">{t.filterCategory}</span>
                <select value={category} onChange={(event) => setCategory(event.target.value as ListingCategory | "")}>
                  <option value="">{t.allCategories}</option>
                  {categories.map((item) => <option key={item} value={item}>{categoryLabels[item]}</option>)}
                </select>
              </label>
              <label className="select-field size-filter">
                <span className="sr-only">{t.filterSize}</span>
                <select value={size} onChange={(event) => setSize(event.target.value)}>
                  <option value="">{t.anySize}</option>
                  {["XS", "S", "M", "L", "XL", t.customSize].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <button
                className={`match-button ${matchMode ? "match-active" : ""}`}
                onClick={() => setShowMatch((current) => !current)}
                type="button"
              >
                <Sparkles size={16} /> {t.matchMe}
              </button>
            </div>
          </div>

          {showMatch && (
            <form className="match-panel" onSubmit={applyMatch}>
              <div className="match-panel-copy">
                <span className="match-icon"><Sparkles size={17} /></span>
                <span><strong>{t.matchTitle}</strong><small>{t.matchDescription}</small></span>
              </div>
              <label>
                <span>{t.lookingFor}</span>
                <select value={matchCategory} onChange={(event) => setMatchCategory(event.target.value as ListingCategory | "")}>
                  <option value="">{t.allCategories}</option>
                  {categories.map((item) => <option key={item} value={item}>{categoryLabels[item]}</option>)}
                </select>
              </label>
              <label>
                <span>{t.mySize}</span>
                <select value={matchSize} onChange={(event) => setMatchSize(event.target.value)}>
                  <option value="">{t.anySize}</option>
                  {["XS", "S", "M", "L", "XL"].map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <button className="button button-dark button-small" disabled={!matchCategory && !matchSize} type="submit">
                {t.showMatches} <ArrowRight size={15} />
              </button>
            </form>
          )}

          {error && (
            <div className="notice notice-error" role="alert">
              <div><strong>{t.catalogUnavailable}</strong><p>{error}</p></div>
              <button className="text-button" onClick={() => void loadListings()} type="button">{t.tryAgain}</button>
            </div>
          )}

          {loading ? (
            <div className="catalog-status"><LoaderCircle className="spin" size={24} /><span>{t.loadingCatalog}</span></div>
          ) : !error && filteredListings.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon"><Shirt size={23} /></span>
              <h3>{matchMode ? t.noMatches : savedOnly ? t.savedEmpty : t.catalogEmpty}</h3>
              <p>{matchMode ? t.tryAnotherFilter : savedOnly ? t.savedHint : t.firstListing}</p>
              <button className="text-button" onClick={clearFilters} type="button">{t.showEverything} <ArrowRight size={15} /></button>
            </div>
          ) : (
            <>
              <div className="results-meta">
                <span>{savedOnly ? t.savedEdit : matchMode ? t.yourMatches : t.freshlyFound} <b>{filteredListings.length}</b></span>
                {matchMode && <button className="clear-match" onClick={() => setMatchMode(false)} type="button">{t.clearMatches} <X size={13} /></button>}
              </div>
              <div className="listing-grid">
                {filteredListings.map((listing, index) => (
                  <ListingCard
                    isSaved={savedIds.includes(listing.id)}
                    categoryLabels={categoryLabels}
                    conditionLabels={conditionLabels}
                    language={language}
                    key={listing.id}
                    listing={listing}
                    matchScore={matchMode ? (listing.category === matchPreferences.category ? 2 : 0)
                      + (listing.size.toLowerCase() === matchPreferences.size.toLowerCase() ? 2 : listing.size.toLowerCase() === "custom" ? 1 : 0) : 0}
                    onOpen={() => setSelectedListing(listing)}
                    onToggleSaved={() => toggleSaved(listing.id)}
                    priority={index < 3}
                    t={t}
                  />
                ))}
              </div>
            </>
          )}

          <div className="catalog-footnote">
            <span><Leaf size={15} /> {t.catalogFootnote}</span>
            <button className="text-button" onClick={() => setCreateOpen(true)} type="button">{t.sharePrompt} <ArrowRight size={15} /></button>
          </div>
        </section>

        <section className="impact-section" id="how-it-works">
          <div className="impact-content page-width">
            <div className="impact-copy">
              <p className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> {t.circleEyebrow}</p>
              <h2>{t.impactTitle}<br /><em>{t.impactTitleEmphasis}</em></h2>
              <p>{t.impactDescription}</p>
              <a className="button button-light" href="#discover">{t.exploreCommunity} <ArrowRight size={16} /></a>
            </div>
            <div className="impact-steps">
              <div className="impact-step"><span>01</span><div><h3>{t.findPiece}</h3><p>{t.findPieceDescription}</p></div><Shirt size={20} /></div>
              <div className="impact-step"><span>02</span><div><h3>{t.passAlong}</h3><p>{t.passAlongDescription}</p></div><ArrowRight size={20} /></div>
              <div className="impact-step"><span>03</span><div><h3>{t.makeItNew}</h3><p>{t.makeItNewDescription}</p></div><Sparkles size={20} /></div>
            </div>
          </div>
          <span className="impact-decoration" aria-hidden="true">RE:USE</span>
        </section>
      </main>

      <footer className="site-footer page-width">
        <a className="brand" href="#top"><span className="brand-mark"><Leaf size={17} /></span><span>re<span className="brand-colon">:</span>wear</span></a>
        <p>{t.footerLine} <span>© 2026 RE:WEAR</span></p>
        <a href="#top" className="footer-top">{t.backToTop} <ArrowDownRight size={14} /></a>
      </footer>

      {createOpen && <CreateListingDialog categoryLabels={categoryLabels} conditionLabels={conditionLabels} onClose={() => setCreateOpen(false)} onCreated={(listing) => {
        setListings((current) => [listing, ...current]);
        setCreateOpen(false);
        setTab("ALL");
        setCategory("");
        setSize("");
        setSavedOnly(false);
        setMatchMode(false);
        setError("");
      }} t={t} />}
      {selectedListing && (
        <ListingDetailsDialog
          categoryLabels={categoryLabels}
          conditionLabels={conditionLabels}
          isSaved={savedIds.includes(selectedListing.id)}
          language={language}
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onToggleSaved={() => toggleSaved(selectedListing.id)}
          t={t}
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
  categoryLabels,
  conditionLabels,
  language,
  t,
  onOpen,
  onToggleSaved,
}: {
  listing: Listing;
  isSaved: boolean;
  matchScore: number;
  priority: boolean;
  categoryLabels: Record<ListingCategory, string>;
  conditionLabels: Record<Listing["condition"], string>;
  language: Language;
  t: typeof translations.en;
  onOpen: () => void;
  onToggleSaved: () => void;
}) {
  const imageUrl = resolveImageUrl(listing.imageUrl);

  return (
    <article className="listing-card">
      <div className="listing-image-wrap">
        <button className="listing-image-button" onClick={onOpen} type="button" aria-label={`${t.listingView}: ${listing.title}`}>
          {imageUrl
            ? <img alt="" className="listing-image" loading={priority ? "eager" : "lazy"} src={imageUrl} />
            : <span className="image-placeholder"><Shirt size={34} /></span>}
        </button>
        <span className={`listing-type ${listing.type === "REDESIGN" ? "type-redesign" : ""}`}>
          {listing.type === "REDESIGN" ? t.designerService : t.preLoved}
        </span>
        <button
          aria-label={isSaved ? t.removeSaved : t.saveListing}
          aria-pressed={isSaved}
          className={`favorite-button ${isSaved ? "favorite-active" : ""}`}
          onClick={onToggleSaved}
          type="button"
        >
          <Heart size={17} fill={isSaved ? "currentColor" : "none"} />
        </button>
        {matchScore > 0 && <span className="match-score"><Sparkles size={12} /> {matchScore * 25}% {t.fit}</span>}
      </div>
      <div className="listing-info">
        <div className="listing-kicker"><span>{categoryLabels[listing.category]}</span><span>{conditionLabels[listing.condition]}</span></div>
        <button className="listing-title" onClick={onOpen} type="button">{listing.title}</button>
        <div className="listing-meta"><span>{t.sizeLabel} {listing.size}</span><span className="meta-dot" /><span><MapPin size={12} /> {listing.location}</span></div>
        <div className="listing-bottom"><span className="listing-price">{formatPrice(listing.price, language)}</span><span className="listing-seller">{t.by} {listing.sellerName}</span></div>
      </div>
    </article>
  );
}

function CreateListingDialog({
  onClose,
  onCreated,
  categoryLabels,
  conditionLabels,
  t,
}: {
  onClose: () => void;
  onCreated: (listing: Listing) => void;
  categoryLabels: Record<ListingCategory, string>;
  conditionLabels: Record<Listing["condition"], string>;
  t: typeof translations.en;
}) {
  const [draft, setDraft] = useState<ListingDraft>(emptyDraft);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(
    () => selectedImage ? URL.createObjectURL(selectedImage) : "",
    [selectedImage],
  );

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function updateDraft<Key extends keyof ListingDraft>(key: Key, value: ListingDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const imageUrl = selectedImage ? await uploadImage(selectedImage) : "";
      const listing = await createListing({ ...draft, imageUrl });
      onCreated(listing);
    } catch (submitError) {
      setFormError(getErrorMessage(submitError, t.listingSaveFailed, t.networkError));
    } finally {
      setSubmitting(false);
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const image = event.target.files?.[0] ?? null;
    setFormError("");
    if (image && image.size > 5 * 1024 * 1024) {
      setSelectedImage(null);
      event.target.value = "";
      setFormError(t.chooseSmallImage);
      return;
    }
    if (image && !["image/jpeg", "image/png", "image/gif", "image/webp"].includes(image.type)) {
      setSelectedImage(null);
      event.target.value = "";
      setFormError(t.chooseSupportedImage);
      return;
    }
    setSelectedImage(image);
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section aria-labelledby="create-title" aria-modal="true" className="dialog-card create-dialog" role="dialog">
        <div className="dialog-header">
          <div><p className="eyebrow">{t.passItOnEyebrow}</p><h2 id="create-title">{t.createTitle} <em>{t.createTitleEmphasis}</em></h2></div>
          <button aria-label={t.closeDialog} className="dialog-close" onClick={onClose} type="button"><X size={19} /></button>
        </div>
        <p className="dialog-intro">{t.createDescription}</p>
        <form className="listing-form" onSubmit={handleSubmit}>
          <label className="form-wide">{t.hereTo}
            <select onChange={(event) => updateDraft("type", event.target.value as ListingType)} value={draft.type}>
              <option value="SALE">{t.passAlongPiece}</option>
              <option value="REDESIGN">{t.offerRedesign}</option>
            </select>
          </label>
          <label className="form-wide">{t.listingTitle}
            <input maxLength={120} onChange={(event) => updateDraft("title", event.target.value)} placeholder={t.listingTitlePlaceholder} required value={draft.title} />
          </label>
          <label>{t.description}
            <textarea maxLength={1000} onChange={(event) => updateDraft("description", event.target.value)} placeholder={t.descriptionPlaceholder} required rows={3} value={draft.description} />
          </label>
          <label>{t.priceKrw}
            <input min="0" onChange={(event) => updateDraft("price", Number(event.target.value))} required step="1000" type="number" value={draft.price} />
          </label>
          <label>{t.yourName}
            <input maxLength={80} onChange={(event) => updateDraft("sellerName", event.target.value)} placeholder={t.namePlaceholder} required value={draft.sellerName} />
          </label>
          <label>{t.category}
            <select onChange={(event) => updateDraft("category", event.target.value as ListingCategory)} value={draft.category}>
              {categories.map((item) => <option key={item} value={item}>{categoryLabels[item]}</option>)}
            </select>
          </label>
          <label>{t.size}
            <input maxLength={16} onChange={(event) => updateDraft("size", event.target.value)} placeholder={t.sizePlaceholder} required value={draft.size} />
          </label>
          <label>{t.condition}
            <select onChange={(event) => updateDraft("condition", event.target.value as Listing["condition"])} value={draft.condition}>
              {conditions.map((item) => <option key={item} value={item}>{conditionLabels[item]}</option>)}
            </select>
          </label>
          <label>{t.location}
            <input maxLength={100} onChange={(event) => updateDraft("location", event.target.value)} required value={draft.location} />
          </label>
          <label className="form-wide image-upload-field">{t.photo} <span className="optional-label">{t.photoOptional}</span>
            <input accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageChange} ref={imageInputRef} type="file" />
          </label>
          {previewUrl && (
            <div className="image-preview form-wide">
              <img alt={t.selectedPhotoAlt} src={previewUrl} />
              <div>
                <strong>{selectedImage?.name}</strong>
                <span>{selectedImage ? `${(selectedImage.size / (1024 * 1024)).toFixed(2)} MB` : ""}</span>
                <button className="text-button" onClick={() => {
                  setSelectedImage(null);
                  if (imageInputRef.current) imageInputRef.current.value = "";
                }} type="button">{t.removePhoto} <X size={13} /></button>
              </div>
            </div>
          )}
          {formError && <p className="form-error form-wide" role="alert">{formError}</p>}
          <button className="button button-dark form-wide submit-button" disabled={submitting} type="submit">
            {submitting ? <><LoaderCircle className="spin" size={17} /> {t.savingListing}</> : <>{t.addToEdit} <ArrowRight size={16} /></>}
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
  categoryLabels,
  conditionLabels,
  language,
  t,
}: {
  listing: Listing;
  isSaved: boolean;
  onClose: () => void;
  onToggleSaved: () => void;
  categoryLabels: Record<ListingCategory, string>;
  conditionLabels: Record<Listing["condition"], string>;
  language: Language;
  t: typeof translations.en;
}) {
  const imageUrl = resolveImageUrl(listing.imageUrl);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section aria-labelledby="details-title" aria-modal="true" className="dialog-card details-dialog" role="dialog">
        <button aria-label={t.closeDialog} className="dialog-close details-close" onClick={onClose} type="button"><X size={19} /></button>
        <div className="details-image">
          {imageUrl ? <img alt="" src={imageUrl} /> : <span className="image-placeholder"><Shirt size={36} /></span>}
          <span className={`listing-type ${listing.type === "REDESIGN" ? "type-redesign" : ""}`}>
            {listing.type === "REDESIGN" ? t.designerService : t.preLoved}
          </span>
        </div>
        <div className="details-copy">
          <p className="eyebrow">{categoryLabels[listing.category]} · {conditionLabels[listing.condition]}</p>
          <h2 id="details-title">{listing.title}</h2>
          <p className="details-description">{listing.description}</p>
          <div className="details-meta"><span>{t.sizeLabel} {listing.size}</span><span><MapPin size={14} /> {listing.location}</span><span>{t.by} {listing.sellerName}</span></div>
          <div className="details-bottom">
            <strong>{formatPrice(listing.price, language)}</strong>
            <button className={`button ${isSaved ? "button-saved" : "button-dark"}`} onClick={onToggleSaved} type="button">
              {isSaved ? <><Check size={16} /> {t.detailsSaved}</> : <><Heart size={16} /> {t.saveForLater}</>}
            </button>
          </div>
          <p className="contact-note">{t.mvpNote}</p>
        </div>
      </section>
    </div>
  );
}

export default App;
