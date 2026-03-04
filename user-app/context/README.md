# User app – context

React context providers for app-wide state.

- **AuthContext** – User, token, login/logout, `updateUser` for profile edits. Persists to AsyncStorage.
- **LocationContext** – User address, lat/lon, location name; syncs with backend and supports map/search selection.
