// Reproducible vector-drawn app assets. No copy of the school's logo.
// Run: swift -module-cache-path /tmp/cnisen-swift-cache scripts/generate-brand-assets.swift
import AppKit
import Foundation
let navy=NSColor(srgbRed:38/255,green:38/255,blue:76/255,alpha:1)
let coral=NSColor(srgbRed:236/255,green:64/255,blue:64/255,alpha:1)
let output=URL(fileURLWithPath:FileManager.default.currentDirectoryPath).appendingPathComponent("assets/brand")
try FileManager.default.createDirectory(at:output,withIntermediateDirectories:true)
func render(_ name:String,_ size:Int,background:Bool,monochrome:Bool=false,onlyBackground:Bool=false)throws{
 let pixels=NSBitmapImageRep(bitmapDataPlanes:nil,pixelsWide:size,pixelsHigh:size,bitsPerSample:8,samplesPerPixel:4,hasAlpha:true,isPlanar:false,colorSpaceName:.deviceRGB,bytesPerRow:0,bitsPerPixel:0)!
 let context=NSGraphicsContext(bitmapImageRep:pixels)!
 NSGraphicsContext.saveGraphicsState();NSGraphicsContext.current=context
 let scale=CGFloat(size)/1024
 context.cgContext.scaleBy(x:scale,y:scale)
 if background{navy.setFill();NSRect(x:0,y:0,width:1024,height:1024).fill()}
 if !onlyBackground{
  let frame=NSBezierPath(roundedRect:NSRect(x:225,y:225,width:574,height:574),xRadius:44,yRadius:44)
  (monochrome ? NSColor.white:coral).setStroke();frame.lineWidth=26;frame.stroke()
  let paragraph=NSMutableParagraphStyle();paragraph.alignment = .center
  let attributes:[NSAttributedString.Key:Any]=[.font:NSFont(name:"Georgia",size:330) ?? NSFont.systemFont(ofSize:330),.foregroundColor:NSColor.white,.paragraphStyle:paragraph]
  ("cn." as NSString).draw(in:NSRect(x:230,y:320,width:570,height:420),withAttributes:attributes)
 }
 NSGraphicsContext.restoreGraphicsState()
 guard let data=pixels.representation(using:.png,properties:[:])else{fatalError("PNG encoder failed")}
 try data.write(to:output.appendingPathComponent(name))
}
try render("icon.png",1024,background:true)
try render("favicon.png",96,background:true)
try render("android-foreground.png",1024,background:false)
try render("android-background.png",1024,background:true,onlyBackground:true)
try render("android-monochrome.png",1024,background:false,monochrome:true)
try render("splash.png",512,background:false)
print("Generated six brand assets in assets/brand")
