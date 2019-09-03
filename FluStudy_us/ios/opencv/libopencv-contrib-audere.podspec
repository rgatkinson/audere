Pod::Spec.new do |spec|
  spec.name                 = 'libopencv-contrib-audere-3.4.6-xcode10.1'
  spec.version              = '3.4.6'
  spec.license              = { :type => 'BSD' }
  spec.homepage             = 'https://opencv.org/'
  spec.authors              = { 'OpenCV Team' => 'admin@opencv.org', 'Ram Kandasamy' => 'ram@auderenow.org' }
  spec.summary              = 'OpenCV with contrib extra modules for iOS'
  spec.source               = { :http => 'https://s3-us-west-2.amazonaws.com/fileshare.auderenow.io/public/opencv2.framework.3.4.6-xcode10.1.zip'}
  spec.source_files         = 'opencv2.framework/Versions/A/Headers/**/*{.h,.hpp}'
  spec.public_header_files  = "opencv2.framework/Versions/A/Headers/**/*{.h,.hpp}"
  spec.preserve_paths       = "opencv2.framework"
  spec.vendored_frameworks  = "opencv2.framework"
  spec.header_mappings_dir  = "opencv2.framework/Versions/A/Headers/"
  spec.frameworks           = "Accelerate", "AssetsLibrary", "AVFoundation", "CoreGraphics", "CoreImage", "CoreMedia","CoreVideo","Foundation","QuartzCore","UIKit"

end
