import { renderLanding } from "../features/authentication/components/LandingPage.js";
import { renderAuthModal } from "../features/authentication/components/AuthModal.js";
import { renderOnboarding } from "../features/onboarding/components/OnboardingWizard.js";
import { renderDashboard } from "../features/weather/components/Dashboard.js";
import { renderProfile } from "../features/profile/components/ProfilePage.js";
import { getSessionUser, signIn, signOut, signUp } from "../features/authentication/services/authService.js";
import { getPreferences, savePreferences } from "../features/onboarding/services/preferencesService.js";

export function createApp(root) {
  let activeUser = getSessionUser();
  let preferences = activeUser ? getPreferences(activeUser.id) : null;
  let currentCity = preferences?.homeCity || null;
  let screen = activeUser ? (preferences?.isOnboarded ? "dashboard" : "onboarding") : "landing";

  const navigate = (nextScreen) => { screen = nextScreen; render(); };
  const handleAuth = async (mode, values) => {
    const result = mode === "signup" ? await signUp(values) : await signIn(values);
    if (!result.ok) return result;
    activeUser = result.user;
    preferences = getPreferences(activeUser.id);
    currentCity = preferences?.homeCity || null;
    navigate(preferences?.isOnboarded ? "dashboard" : "onboarding");
    return result;
  };
  const render = () => {
    document.body.dataset.theme = preferences?.theme || "system";
    if (screen === "landing") return renderLanding(root, { onOpenAuth: (mode) => renderAuthModal(root, { mode, onSubmit: handleAuth, onClose: () => navigate("landing") }) });
    if (screen === "onboarding") return renderOnboarding(root, { user: activeUser, initialPreferences: preferences, onComplete: (values) => { preferences = savePreferences(activeUser.id, { ...values, isOnboarded: true }); currentCity = preferences.homeCity; navigate("dashboard"); } });
    if (screen === "profile") return renderProfile(root, { user: activeUser, preferences, onSave: (changes) => { preferences = savePreferences(activeUser.id, { ...preferences, ...changes }); if (changes.homeCity) currentCity = changes.homeCity; navigate("dashboard"); }, onBack: () => navigate("dashboard"), onSignOut: () => { signOut(); activeUser = null; preferences = null; currentCity = null; navigate("landing"); } });
    renderDashboard(root, { user: activeUser, preferences, initialCity: currentCity || preferences.homeCity, onCityChange: (city) => { currentCity = city; }, onPreferencesChange: (changes) => { preferences = savePreferences(activeUser.id, { ...preferences, ...changes }); render(); }, onOpenProfile: () => navigate("profile"), onOpenDashboard: () => navigate("dashboard"), onSignOut: () => { signOut(); activeUser = null; preferences = null; currentCity = null; navigate("landing"); } });
  };
  render();
}
