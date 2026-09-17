cask "bob-weather" do
  version "1.0.0"
  sha256 "b89b49376c11f1c854d4078e6994c4f33c087a48d64c8b22464cc16357f15042"

  url "https://github.com/kdekorte/bob-weather/releases/download/v#{version}/bob-weather-macos-arm64-#{version}.tar.gz"
  name "bob-weather"
  desc "Fullscreen kiosk-style weather dashboard built with Neutralino.js"
  homepage "https://github.com/kdekorte/bob-weather"

  depends_on macos: ">= :big_sur"

  app "bob-weather.app"

  zap trash: [
    "~/Library/Application Support/bob-weather",
    "~/Library/Preferences/com.ibm.bob-weather.plist",
    "~/Library/Saved Application State/com.ibm.bob-weather.savedState",
  ]
end
