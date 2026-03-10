## Packages
date-fns | Formatting and calculating dates
recharts | Dashboard charts and metrics
lucide-react | Essential UI icons
clsx | Class name merging (often required by shadcn)
tailwind-merge | Required by shadcn utility
@hookform/resolvers | Form validation with Zod
react-hook-form | Form state management
zod | Schema validation

## Notes
- Assume `processoDigital` includes nested `fases` in backend responses
- Numeric fields in PostgreSQL (like `valor_contrato`, `valor_empenho`) return as strings to preserve precision. We must parse them as floats in frontend calculations but send them as strings (or let Zod coerce them).
- Authenticated routes depend on `/api/me`. If it returns 401, user is redirected to login.
