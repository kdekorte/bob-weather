cask "bob-weather" do
  version "1.0.1"
  sha256 "4fb76255cf01fc9ab7325556b6256db155734dfb252d3aa63f4a33f8e8147cd7"

  url "https://github.com/kdekorte/bob-weather/releases/download/v#{version}/bob-weather-macos-arm64-#{version}.tar.gz"
  name "bob-weather"
  desc "Fullscreen kiosk-style weather dashboard built with Neutralino.js"
  homepage "https://github.com/kdekorte/bob-weather"

  depends_on macos: :big_sur

  app "bob-weather.app"

  zap trash: [
    "~/Library/Application Support/bob-weather",
    "~/Library/Preferences/com.kdekorte.bob-weather.plist",
    "~/Library/Saved Application State/com.kdekorte.bob-weather.savedState",
  ]
end
