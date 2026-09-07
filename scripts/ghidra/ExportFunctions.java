import java.nio.file.*;
import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.*;
import ghidra.program.model.listing.*;
public class ExportFunctions extends GhidraScript {
 public void run() throws Exception {
  String[] args=getScriptArgs();Files.createDirectories(Path.of(args[0]));DecompInterface d=new DecompInterface();d.openProgram(currentProgram);
  for(int i=1;i<args.length;i++) {
   Function f=getFunctionAt(toAddr(args[i]));if(f==null){disassemble(toAddr(args[i]));f=createFunction(toAddr(args[i]),null);}
   if(f==null){println("Missing "+args[i]);continue;}
   DecompileResults r=d.decompileFunction(f,90,monitor);
   if(r.decompileCompleted()){Files.writeString(Path.of(args[0],args[i]+"_"+f.getName()+".c"),r.getDecompiledFunction().getC());println("Exported "+f.getName());}else println(r.getErrorMessage());
  }d.dispose();
 }
}
