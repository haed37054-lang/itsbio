export type RtFinderAnswers = { application?: string; gdna?: string; sample?: string; format?: string };

/** Same decision branches as the manufacturer's current RT product finder. */
export function findRtProduct(answers: RtFinderAnswers): string | undefined {
  const { application, gdna, sample, format } = answers;
  if (application === "rtpcr") return "G597";
  if (application === "mirna") return "G898";
  if (application !== "cdna" || !gdna || !sample || !format) return undefined;
  if (gdna === "yes" || gdna === "unsure") return "G592";
  if (format === "mastermix") return "G590";
  if (format === "kit") return sample === "routine" ? "G236" : "G594";
  if (format === "enzyme") return sample === "routine" ? "G237" : "G593";
  if (format === "any") return sample === "routine" ? "G590" : "G594";
  return undefined;
}
