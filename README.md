# Hamplard — Frontend Repo

> **Next.js 14 frontend for Africa's practical skills online learning platform**

This is **Repo 3 of 3** in the Hamplard project:

| Repo | Description |
|------|-------------|
| `hamplard-contract` | Soroban smart contract — course payments + certificates |
| `hamplard-backend` | NestJS API — content, progress, users |
| `hamplard-frontend` ← you are here | Next.js 14 — student and instructor portal |

---

## Pages

| Route | Auth | Description |
|---|---|---|
| `/` | — | Public course marketplace with search and category filters |
| `/auth/login` | — | Freighter wallet connect with student/instructor role selection |
| `/dashboard/courses` | ✓ | Student: enrolled courses. Instructor: redirects to instructor dashboard |
| `/dashboard/courses/:id` | — | Course detail page — overview, curriculum, enroll button |
| `/dashboard/courses/:id/learn` | ✓ | Video player with lesson sidebar, progress tracking, completion |
| `/dashboard/courses/create` | ✓ INSTRUCTOR | Create course form with on-chain registration |
| `/dashboard/instructor` | ✓ INSTRUCTOR | Revenue stats + my courses list |
| `/dashboard/certificates` | ✓ | Student's earned certificates with copy + share links |
| `/certificates/:id` | — | **Public** certificate verification page (no login needed) |
| `/notifications` | ✓ | Notification feed with colour-coded types |

---

## Design System

Hamplard's foundational token system is documented in:

- `src/styles/tokens.css` (source of truth for CSS variables)
- `design-system-tokens.md` (hex/RGB usage notes + WCAG checks)
- `typography-system.md` (modular type scale and semantic text roles)

**Typography:**
- Display headings: Playfair Display (serif)
- Body: DM Sans
- Code/IDs: JetBrains Mono

---

## Key Features

**Public course marketplace** (`/`) — browse, search, and filter active courses by category and level without signing in. The homepage shows a category pill bar with all eight Hamplard skill areas.

**Role-aware login** (`/auth/login`) — the login page has a student/instructor toggle. First-time users pick their role here and it is set on their account.

**Course learn page** (`/dashboard/courses/:id/learn`) — full-screen layout with a lesson sidebar (modules expanded/collapsed, completed lessons marked with checkmarks) and a main content area with the video player. Students click "Mark complete" after each lesson. Progress percentage updates live.

**Certificate verification page** (`/certificates/:id`) — a public, shareable page showing a gold certificate with the student's name, course title, instructor, issue date, and blockchain verification status. Uses server-side rendering for fast sharing.

**Instructor course creation** — three-step flow: fill in course details → upload thumbnail → register on Stellar via Freighter → submit for admin review. The form generates a unique `courseId` automatically.

---

## Setup

```bash
cp .env.example .env.local   # fill in contract ID + backend URL
npm install
npm run dev                   # → http://localhost:3001
```

Install [Freighter](https://freighter.app) and switch it to Testnet.

---

## License

MIT
TODO: Build Instructor Referral Program UI

1. Project Discovery & Preparation

1. [ ] Inspect the repository structure.
2. [ ] Confirm the project uses Next.js.
3. [ ] Confirm the project uses the App Router.
4. [ ] Locate "src/app/dashboard/instructor".
5. [ ] Confirm the instructor dashboard route structure.
6. [ ] Inspect existing instructor dashboard pages.
7. [ ] Review existing dashboard layout components.
8. [ ] Review existing dashboard navigation.
9. [ ] Identify existing UI components.
10. [ ] Inspect "src/components/ui".
11. [ ] Check whether "SocialShare.tsx" already exists.
12. [ ] Review existing button components.
13. [ ] Review existing card components.
14. [ ] Review existing table components.
15. [ ] Review existing badge components.
16. [ ] Review existing toast/notification components.
17. [ ] Review existing icon library.
18. [ ] Review existing typography conventions.
19. [ ] Review existing spacing conventions.
20. [ ] Review existing responsive design patterns.
21. [ ] Identify the project's preferred styling approach.
22. [ ] Identify whether Tailwind CSS is used.
23. [ ] Review existing dashboard color conventions.
24. [ ] Review existing instructor-specific components.
25. [ ] Search for referral-related types.
26. [ ] Search for existing referral APIs.
27. [ ] Search for existing referral data models.
28. [ ] Search for existing instructor statistics.
29. [ ] Search for commission-related functionality.
30. [ ] Search for existing course revenue calculations.
31. [ ] Search for existing invite functionality.
32. [ ] Search for existing social-sharing components.
33. [ ] Review route-level loading patterns.
34. [ ] Review route-level error patterns.
35. [ ] Review existing client components.
36. [ ] Confirm whether clipboard functionality is already used.
37. [ ] Confirm whether browser APIs require ""use client"".
38. [ ] Review test conventions.
39. [ ] Review lint and formatting rules.
40. [ ] Define the implementation scope.

2. Referral Page Setup

41. [ ] Create "src/app/dashboard/instructor/referrals/page.tsx".
42. [ ] Follow the existing App Router conventions.
43. [ ] Determine whether the page requires client-side behavior.
44. [ ] Add ""use client"" if required for clipboard/share interactions.
45. [ ] Avoid client-side code that is not necessary.
46. [ ] Import required React utilities.
47. [ ] Import existing UI components.
48. [ ] Import "ReferralStats".
49. [ ] Import "SocialShare".
50. [ ] Define the referral page component.
51. [ ] Add the page heading.
52. [ ] Add a concise referral-program description.
53. [ ] Explain that instructors can invite colleagues.
54. [ ] Explain that successful referrals can earn bonuses.
55. [ ] Create the referral-link section.
56. [ ] Create the referral statistics section.
57. [ ] Create the referral history section.
58. [ ] Create the bonus terms section.
59. [ ] Create the social-sharing section.
60. [ ] Keep the page structure easy to scan.
61. [ ] Follow existing dashboard layout conventions.
62. [ ] Reuse existing page container components where available.
63. [ ] Reuse existing card components where available.
64. [ ] Reuse existing button components where available.
65. [ ] Reuse existing typography components where available.
66. [ ] Avoid unnecessary new dependencies.
67. [ ] Avoid unrelated dashboard changes.
68. [ ] Keep the page accessible.
69. [ ] Keep the implementation maintainable.
70. [ ] Confirm the page renders without errors.

3. Referral Link

71. [ ] Define the instructor referral link source.
72. [ ] Determine whether the link comes from existing instructor data.
73. [ ] Determine whether a static development value is required temporarily.
74. [ ] Ensure the referral link is unique to the instructor.
75. [ ] Display the complete referral link.
76. [ ] Place the referral link inside a visually distinct container.
77. [ ] Ensure long referral links do not break the layout.
78. [ ] Allow the link to wrap or scroll appropriately.
79. [ ] Add a copy button.
80. [ ] Use "navigator.clipboard" for copying.
81. [ ] Verify clipboard access occurs only in the browser.
82. [ ] Copy the exact referral URL.
83. [ ] Prevent accidental whitespace from being copied.
84. [ ] Add copy success feedback.
85. [ ] Change button text/icon temporarily after copying if appropriate.
86. [ ] Restore the normal copy state after feedback.
87. [ ] Handle clipboard failures gracefully.
88. [ ] Display an appropriate error notification if copying fails.
89. [ ] Avoid exposing clipboard errors unnecessarily.
90. [ ] Ensure repeated copy actions work.
91. [ ] Ensure the button remains keyboard accessible.
92. [ ] Ensure the button has an accessible label.
93. [ ] Ensure the link itself is selectable if appropriate.
94. [ ] Ensure the copy button works on supported mobile browsers.
95. [ ] Test copying from the dashboard.
96. [ ] Test copying multiple times.
97. [ ] Test copy behavior after navigation.
98. [ ] Test copy behavior after page refresh.
99. [ ] Verify the copied value exactly matches the displayed referral link.
100. [ ] Confirm referral-link functionality is complete.

4. ReferralStats Component

101. [ ] Create "src/components/instructor/ReferralStats.tsx".
102. [ ] Define a reusable "ReferralStats" component.
103. [ ] Define the component props.
104. [ ] Type all statistic values.
105. [ ] Add referrals-sent statistic.
106. [ ] Add referrals-signed-up statistic.
107. [ ] Add referrals-published-course statistic.
108. [ ] Add total-bonus-earned statistic.
109. [ ] Display each statistic as a separate card.
110. [ ] Add an appropriate icon to each statistic.
111. [ ] Add clear statistic labels.
112. [ ] Display the numeric values prominently.
113. [ ] Format bonus amounts consistently.
114. [ ] Use the project's currency convention.
115. [ ] Avoid hard-coding misleading totals.
116. [ ] Ensure zero values display correctly.
117. [ ] Ensure large values remain readable.
118. [ ] Ensure cards are responsive.
119. [ ] Ensure cards stack appropriately on small screens.
120. [ ] Ensure cards align consistently on larger screens.
121. [ ] Reuse existing card styles where possible.
122. [ ] Reuse existing icon styles.
123. [ ] Avoid excessive visual decoration.
124. [ ] Keep the component independent from page layout.
125. [ ] Keep the component easy to test.
126. [ ] Ensure values come from props/data rather than duplicated constants.
127. [ ] Add appropriate accessibility labels.
128. [ ] Ensure the bonus statistic is clearly distinguished.
129. [ ] Ensure all four required statistics are visible.
130. [ ] Confirm "ReferralStats" renders correctly.

5. Referral Statistics Data

131. [ ] Identify the source of referral statistics.
132. [ ] Check for an existing referral endpoint.
133. [ ] Check for existing instructor dashboard statistics.
134. [ ] Check for existing referral service methods.
135. [ ] Determine whether server-side data fetching is available.
136. [ ] Determine whether client-side fetching is required.
137. [ ] Avoid inventing backend APIs unless explicitly required.
138. [ ] Use existing project data contracts where available.
139. [ ] Define a typed statistics model.
140. [ ] Map referrals sent to the correct value.
141. [ ] Map referrals signed up to the correct value.
142. [ ] Map published-course referrals to the correct value.
143. [ ] Map total bonus earned to the correct value.
144. [ ] Ensure counts are numeric.
145. [ ] Ensure bonus values are numeric or correctly formatted.
146. [ ] Handle missing statistics safely.
147. [ ] Handle zero statistics safely.
148. [ ] Handle loading states if data is fetched asynchronously.
149. [ ] Handle data-fetching errors if applicable.
150. [ ] Confirm statistics represent the current instructor.

6. Referral History Table

151. [ ] Create the referral history section.
152. [ ] Add a section heading.
153. [ ] Add a short explanatory description.
154. [ ] Create the referral history table.
155. [ ] Add invitee email column.
156. [ ] Add date joined column.
157. [ ] Add status column.
158. [ ] Add bonus earned column.
159. [ ] Define referral history data types.
160. [ ] Populate the table from referral history data.
161. [ ] Format invitee emails correctly.
162. [ ] Format dates consistently with the application.
163. [ ] Display referral status using badges where appropriate.
164. [ ] Format bonus amounts consistently.
165. [ ] Display zero bonus correctly.
166. [ ] Display pending referral status correctly.
167. [ ] Display signed-up status correctly.
168. [ ] Display published-course status correctly.
169. [ ] Display completed/earned status correctly if supported.
170. [ ] Ensure statuses are understandable.
171. [ ] Add an empty-state message.
172. [ ] Display the empty state when there are no referrals.
173. [ ] Ensure the table is responsive.
174. [ ] Add horizontal scrolling on narrow screens if necessary.
175. [ ] Ensure table headers remain understandable.
176. [ ] Avoid unnecessary table columns.
177. [ ] Keep email values from overflowing.
178. [ ] Ensure dates remain readable.
179. [ ] Ensure bonus values align consistently.
180. [ ] Confirm referral history renders correctly.

7. SocialShare Component

181. [ ] Inspect "src/components/ui/SocialShare.tsx".
182. [ ] Create the component if it does not exist.
183. [ ] Follow existing UI component conventions.
184. [ ] Define the component's props.
185. [ ] Accept the referral URL.
186. [ ] Accept optional share text if required.
187. [ ] Add a copy-link action.
188. [ ] Add an email-share action.
189. [ ] Add a WhatsApp-share action.
190. [ ] Ensure copy uses "navigator.clipboard".
191. [ ] Ensure email uses the appropriate "mailto:" intent.
192. [ ] Ensure WhatsApp uses the appropriate share intent.
193. [ ] Encode referral URL before inserting it into share URLs.
194. [ ] Encode share text before inserting it into share URLs.
195. [ ] Avoid malformed share URLs.
196. [ ] Open email sharing correctly.
197. [ ] Open WhatsApp sharing correctly.
198. [ ] Use "window.open" or project-standard navigation where appropriate.
199. [ ] Ensure external share intents do not break the application.
200. [ ] Add accessible labels to share buttons.

8. Share Behavior

201. [ ] Test copy-link button.
202. [ ] Verify copied URL matches the referral URL.
203. [ ] Test email share button.
204. [ ] Verify email intent is correctly constructed.
205. [ ] Verify referral link is included in the email share.
206. [ ] Verify share text is correctly encoded.
207. [ ] Test WhatsApp share button.
208. [ ] Verify WhatsApp share intent is correctly constructed.
209. [ ] Verify referral link is included in WhatsApp content.
210. [ ] Verify spaces are encoded correctly.
211. [ ] Verify special URL characters are encoded correctly.
212. [ ] Verify the share actions open the correct intents.
213. [ ] Test share buttons on desktop where supported.
214. [ ] Test share buttons on mobile where supported.
215. [ ] Test share buttons with long referral URLs.
216. [ ] Ensure share buttons remain usable on small screens.
217. [ ] Ensure share buttons have visible labels or accessible names.
218. [ ] Ensure icons alone are not the only accessibility cue.
219. [ ] Handle unsupported share behavior gracefully.
220. [ ] Confirm all required share methods work.

9. Bonus Terms Card

221. [ ] Create the bonus terms summary card.
222. [ ] Add a clear card heading.
223. [ ] Explain the referral bonus concept.
224. [ ] Explain that the referred instructor must sign up.
225. [ ] Explain that the referred instructor must publish a course if required.
226. [ ] Explain that the bonus is connected to first-course revenue.
227. [ ] Explain any eligibility conditions available from existing requirements.
228. [ ] Avoid inventing unsupported commission percentages.
229. [ ] Avoid inventing unsupported payment timelines.
230. [ ] Avoid inventing unsupported limits.
231. [ ] Use existing product/business rules if available.
232. [ ] Keep the summary concise.
233. [ ] Add appropriate visual emphasis.
234. [ ] Ensure terms are easy to understand.
235. [ ] Add a note directing instructors to full terms if available.
236. [ ] Avoid presenting assumptions as official terms.
237. [ ] Ensure the card is responsive.
238. [ ] Ensure the card is accessible.
239. [ ] Verify the terms card fits the dashboard design.
240. [ ] Confirm the bonus terms section renders correctly.

10. Responsive & Accessibility Review

241. [ ] Test the page on desktop width.
242. [ ] Test the page on tablet width.
243. [ ] Test the page on mobile width.
244. [ ] Verify statistics cards remain readable.
245. [ ] Verify referral link remains usable.
246. [ ] Verify copy button remains accessible.
247. [ ] Verify share buttons fit within the layout.
248. [ ] Verify the history table works on mobile.
249. [ ] Verify the bonus card does not overflow.
250. [ ] Verify keyboard navigation.
251. [ ] Verify focus states.
252. [ ] Verify button labels.
253. [ ] Verify screen-reader-friendly headings.
254. [ ] Verify semantic table markup.
255. [ ] Verify status badges have meaningful text.
256. [ ] Verify sufficient visual distinction between interactive elements.
257. [ ] Verify no content is hidden accidentally.
258. [ ] Verify long emails do not break the layout.
259. [ ] Verify long referral URLs do not break the layout.
260. [ ] Verify page remains usable at reduced viewport widths.

11. Testing

261. [ ] Add tests for "ReferralStats".
262. [ ] Test referrals-sent count.
263. [ ] Test referrals-signed-up count.
264. [ ] Test published-course count.
265. [ ] Test total bonus amount.
266. [ ] Add tests for referral history rendering.
267. [ ] Test invitee email rendering.
268. [ ] Test date rendering.
269. [ ] Test status rendering.
270. [ ] Test bonus rendering.
271. [ ] Add test for empty referral history.
272. [ ] Add test for copy-link behavior.
273. [ ] Mock "navigator.clipboard" where necessary.
274. [ ] Verify clipboard receives the referral URL.
275. [ ] Add test for clipboard failure handling.
276. [ ] Add tests for email sharing.
277. [ ] Verify the email intent contains the referral URL.
278. [ ] Add tests for WhatsApp sharing.
279. [ ] Verify the WhatsApp intent contains the referral URL.
280. [ ] Verify share URLs are properly encoded.

12. Final Validation & PR

281. [ ] Run the relevant component tests.
282. [ ] Run the complete test suite.
283. [ ] Run linting.
284. [ ] Run TypeScript checks.
285. [ ] Run formatting checks.
286. [ ] Run the production build.
287. [ ] Manually visit "/dashboard/instructor/referrals".
288. [ ] Verify the referral link is displayed.
289. [ ] Verify copy works.
290. [ ] Verify all four statistics display correctly.
291. [ ] Verify referral history renders.
292. [ ] Verify copy, email, and WhatsApp share buttons work.
293. [ ] Verify bonus terms card renders.
294. [ ] Review the final Git diff.
295. [ ] Remove debugging code and unused imports.
296. [ ] Confirm only intended files were changed.
297. [ ] Create the pull request with a clear description.
298. [ ] Include testing and validation results.
299. [ ] Include "Closes #[issue_id]" in the PR description, replacing "[issue_id]" with the actual issue number.
300. [ ] Confirm all acceptance criteria are satisfied and the PR is ready for review.
