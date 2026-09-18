cask "weather-dashboard" do
  version "1.0.1"
  sha256 "4fb76255cf01fc9ab7325556b6256db155734dfb252d3aa63f4a33f8e8147cd7"

  url "https://github.com/kdekorte/weather-dashboard/releases/download/v#{version}/weather-dashboard-macos-arm64-#{version}.tar.gz"
  name "Weather Dashboard"
  desc "Fullscreen kiosk-style weather dashboard built with Neutralino.js"
  homepage "https://github.com/kdekorte/weather-dashboard"

  depends_on macos: :big_sur

  app "weather-dashboard.app"

  zap trash: [
    "~/Library/Application Support/weather-dashboard",
    "~/Library/Preferences/com.kdekorte.weather-dashboard.plist",
    "~/Library/Saved Application State/com.kdekorte.weather-dashboard.savedState",
  ]
end
