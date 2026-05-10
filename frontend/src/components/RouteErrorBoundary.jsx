import { Component } from "react";

/**
 * Suspense altındaki lazy() chunk'ları yüklenirken hata olursa
 * tüm Routes ağacının boşalmasını önler. Hata yerine kullanıcıya
 * "Yeniden yükle" diyebileceği bir kart gösterir.
 *
 * Tipik tetikleyici: dosya parse hatası sonrası tarayıcıda eski chunk
 * referansının kalması ("Failed to fetch dynamically imported module").
 */
export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (typeof console !== "undefined") {
      console.error("[RouteErrorBoundary]", error, info);
    }
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-10 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5" strokeLinecap="round" />
            <path d="M12 16h.01" strokeLinecap="round" strokeWidth="2.4" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-ink">Sayfa yüklenirken bir sorun oluştu</h2>
        <p className="mt-2 max-w-sm text-sm text-ink/55">
          Geliştirme sırasında bir dosya değiştiyse tarayıcının önbelleğinde eski bir
          sürüm kalmış olabilir. Yeniden yükleyerek deneyin.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:bg-accentDark"
        >
          Sayfayı yeniden yükle
        </button>
      </div>
    );
  }
}
