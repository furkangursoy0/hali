# Deploy Checklist (Frontend)

## 1) Environment and Config
- [ ] `EXPO_PUBLIC_APP_ENV` set correctly (`staging` or `production`)
- [ ] `EXPO_PUBLIC_API_BASE_URL` points to correct backend
- [ ] `EXPO_PUBLIC_DAILY_RENDER_LIMIT` set for target environment
- [ ] No secret values committed to repo (`.env*` ignored)

## 2) Functional Smoke Test
- [ ] Login > Home > Select > Result flow works end-to-end
- [ ] Camera and gallery selection works on target devices
- [ ] Search, brand dropdown, collection dropdown work on web/mobile
- [ ] Limit badge updates and limit modal appears when remaining hits zero
- [ ] Limit error page appears if backend returns limit/quota error

## 3) UX and Stability
- [ ] No blocking console/runtime errors during main flow
- [ ] Loading, error and empty states are visible and understandable
- [ ] Web at 100%, 110%, 125% zoom still keeps critical actions reachable
- [ ] Mobile layout tested on at least 2 viewport sizes

## 4) Build and Release
- [ ] `npx tsc --noEmit` passes
- [ ] Web build tested (`npm run web`)
- [ ] Release notes prepared from template
- [ ] Version/tag decided
