import categories from "@/data/plaslabs/categories.json";
import products from "@/data/plaslabs/catalog.json";

export const PLASLABS_ROOT = "/products/plaslabs";
export const PLASLABS_CATEGORIES = categories;
export const PLASLABS_PRODUCTS = products;
export type PlasLabsProduct = (typeof products)[number];

export const COMPACT_GLOVE_BOXES = {
  slug: "compact-glove-box",
  category: "glove-boxes",
  title: "Compact Glove Boxes",
  series: [
    {
      slug: "830-series",
      title: "830-Series",
      summary: "Transfer chamber and removable top.",
      image: "https://plas-labs.com/application/files/6115/8982/7930/830_ABC_AE.jpg",
    },
    {
      slug: "810-series",
      title: "810-Series",
      summary: "Transfer chamber and flat side access door.",
      image: "https://plas-labs.com/application/files/5315/9585/9522/810_SG20.jpg",
    },
    {
      slug: "cp-series",
      title: "CP-Series",
      summary: "Flat side access door with an optional vent outlet.",
      image: "https://plas-labs.com/application/files/7416/0866/1939/830_CP_20.png",
    },
  ],
};

export function plasLabsCategoryHref(slug: string) {
  return `${PLASLABS_ROOT}/${slug}`;
}

export function plasLabsProductHref(slug: string) {
  return `${PLASLABS_ROOT}/item/${slug}`;
}

export function searchPlasLabsProducts(query: string, category?: string) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return products.filter((product) => {
    if (category && product.category !== category) return false;
    const categoryTitle = categories.find(({ slug }) => slug === product.category)?.title;
    const searchable = ["PLAS-LABS", categoryTitle, product.title, product.summary, ...product.models].join(" ").toLowerCase();
    return words.every((word) => searchable.includes(word));
  });
}
