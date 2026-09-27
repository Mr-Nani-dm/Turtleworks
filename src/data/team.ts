export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  /** Path under /public, e.g. "/team/jane.jpg". Optional. */
  photo?: string;
  linkedin?: string;
};

/*
  The team section renders only when this list has real entries.
  Add real people with their consent — never placeholder names or stock photos.
*/
export const team: TeamMember[] = [];
