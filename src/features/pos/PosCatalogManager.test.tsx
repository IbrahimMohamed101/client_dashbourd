// @vitest-environment jsdom
import { type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PosCatalogManager } from "./PosCatalogManager";
import { categories, channels, previewProducts, type Catalog } from "./previewCatalog";
import { fetchPosManager, savePosDraft } from "./catalogApi";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
}));

vi.mock("./catalogApi", () => ({
  fetchPosManager: vi.fn(),
  savePosDraft: vi.fn(),
  publishPosDraft: vi.fn(),
  posCatalogKey: ["pos-catalog", "published"],
  posManagerKey: ["pos-catalog", "manage"],
}));

function baseCatalog(): Catalog {
  return {
    categories: categories.map((entry) => ({ ...entry })),
    channels: channels.map((entry) => ({ ...entry })),
    products: structuredClone(previewProducts),
  };
}
function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><PosCatalogManager /></QueryClientProvider>);
}

describe("POS stage C manager interaction", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fetchPosManager).mockResolvedValue({
      revision: 7, publishedRevision: 7, published: baseCatalog(), draft: null,
    });
  });

  it("finds products directly and filters by visibility", async () => {
    const user = userEvent.setup();
    mount();
    const list = within(await screen.findByRole("group", { name: "قائمة أصناف الكاشير" }));
    expect(list.getByRole("button", { name: /دجاج بالزبدة/ })).toBeInTheDocument();
    await user.type(screen.getByRole("searchbox", { name: "بحث في أصناف الكاشير" }), "سلطة");
    expect(list.getByRole("button", { name: /سلطة بيسك/ })).toBeInTheDocument();
    expect(list.queryByRole("button", { name: /دجاج بالزبدة/ })).not.toBeInTheDocument();
    await user.clear(screen.getByRole("searchbox", { name: "بحث في أصناف الكاشير" }));
    await user.click(screen.getByRole("button", { name: "المخفية" }));
    expect(list.queryByRole("button", { name: /سلطة بيسك/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "الكل" }));
    expect(list.getByRole("button", { name: /سلطة بيسك/ })).toBeInTheDocument();
  });

  it("saves three channel prices as a draft and shows old/new before publishing", async () => {
    const published = baseCatalog();
    vi.mocked(fetchPosManager).mockResolvedValue({
      revision: 7, publishedRevision: 7, published, draft: null,
    });
    vi.mocked(savePosDraft).mockImplementation(async (revision, draft) => ({
      revision: revision + 1, publishedRevision: 7, published, draft,
    }));
    const user = userEvent.setup();
    mount();
    await screen.findByRole("button", { name: "جدول الأسعار" });
    await user.click(screen.getByRole("button", { name: "جدول الأسعار" }));
    const edits = [
      ["100 جم", "25.00"], ["150 جم", "33.00"], ["200 جم", "40.00"],
    ];
    for (const [size, value] of edits) {
      const input = screen.getByRole("textbox", { name: "سعر دجاج بالزبدة " + size + " في restaurant" });
      await user.clear(input);
      await user.type(input, value);
    }
    await user.click(screen.getByRole("button", { name: "حفظ المسودة" }));
    expect(await screen.findByText(/مسودة محفوظة · 3 تغيير/)).toBeInTheDocument();
    expect(vi.mocked(savePosDraft)).toHaveBeenCalledTimes(1);
    const [revision, saved] = vi.mocked(savePosDraft).mock.calls[0];
    expect(revision).toBe(7);
    expect(saved.products[0].variants.map((entry) => entry.prices.restaurant)).toEqual([2500, 3300, 4000]);
    await user.click(screen.getByRole("button", { name: "مراجعة ونشر" }));
    const review = within(screen.getByRole("region", { name: "مراجعة تغييرات منيو الكاشير" }));
    expect(review.getAllByRole("row")).toHaveLength(4);
    expect(review.getByText("24.00 ر.س")).toBeInTheDocument();
    expect(review.getByText("25.00 ر.س")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "نشر المنيو" })).toBeEnabled();
  });
});
