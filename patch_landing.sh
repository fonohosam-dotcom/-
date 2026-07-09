# update Donor to navigate to donation
sed -i 's/setActiveLauncher("donor");/if (onNavigateToDonor) onNavigateToDonor();/g' src/components/LandingView.tsx

# update Fraud to navigate to verify
sed -i 's/setActiveLauncher("report-fraud");/if (onNavigateToTab) onNavigateToTab("verify");/g' src/components/LandingView.tsx

