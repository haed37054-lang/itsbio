import labNavigation from "@/data/aims/navigation.json";
import animalIdNavigation from "@/data/animalid/navigation.json";

export const AIMS_FAMILIES = [
  {
    label: "Lab Products",
    href: "/products/aims#lab-products",
    description: "Surgery and procedure boards, warming equipment, CO₂ systems and rodent restraints.",
    items: labNavigation.map(({ label, links }) => ({ label, href: links[0].href })),
  },
  {
    label: "Animal Identification",
    href: "/products/animalid",
    description: "Tattoo identification systems and upgrade packages for laboratory animals.",
    items: animalIdNavigation.flatMap(({ links }) => links),
  },
] as const;
