Pod::Spec.new do |s|
  s.name           = 'ThemeTransition'
  s.version        = '1.0.0'
  s.summary        = 'Cross-fades the window while the app changes its color scheme.'
  s.description    = 'Snapshots the window, lets the theme change underneath, and fades the snapshot out.'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '16.4',
    :tvos => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
