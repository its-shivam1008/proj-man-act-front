
export const getOrganisationId = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("organisationId");
};
