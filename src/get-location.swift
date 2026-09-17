#!/usr/bin/env swift
//
// get-location.swift — prints "lat,lon" to stdout using CoreLocation,
// then exits 0. Exits 1 if permission is denied or unavailable.
//
// The app bundle's Info.plist must contain NSLocationWhenInUseUsageDescription
// and the binary must be signed with:
//   com.apple.security.personal-information.location = true
//
// Usage (compiled):
//   swiftc get-location.swift -o get-location
//   ./get-location   →  37.3318,-122.0312
//

import CoreLocation
import Foundation

class LocationDelegate: NSObject, CLLocationManagerDelegate {
    let manager = CLLocationManager()
    var done = false

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        manager.requestWhenInUseAuthorization()
        manager.startUpdatingLocation()
    }

    func locationManager(_ manager: CLLocationManager,
                         didUpdateLocations locations: [CLLocation]) {
        guard !done, let loc = locations.last else { return }
        done = true
        print("\(loc.coordinate.latitude),\(loc.coordinate.longitude)")
        exit(0)
    }

    func locationManager(_ manager: CLLocationManager,
                         didFailWithError error: Error) {
        guard !done else { return }
        done = true
        fputs("error: \(error.localizedDescription)\n", stderr)
        exit(1)
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        if status == .denied || status == .restricted {
            fputs("error: location permission denied\n", stderr)
            exit(1)
        }
    }
}

let delegate = LocationDelegate()
// Timeout: if no fix after 8 seconds, give up
DispatchQueue.main.asyncAfter(deadline: .now() + 8) {
    if !delegate.done {
        fputs("error: location timed out\n", stderr)
        exit(1)
    }
}
RunLoop.main.run()
