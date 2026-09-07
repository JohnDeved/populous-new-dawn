import java.util.*;
import ghidra.app.script.GhidraScript;
import ghidra.program.model.listing.*;

// Find callers or data references, then use the same checked exporter.
public class ExportCallers extends GhidraScript {
    public void run() throws Exception {
        String[] args = getScriptArgs();
        if (args.length < 2) throw new IllegalArgumentException("Output directory and target addresses required");
        Set<String> addresses = new TreeSet<>();
        for (int i = 1; i < args.length; i++) {
            for (var reference : getReferencesTo(toAddr(args[i]))) {
                Function function = getFunctionContaining(reference.getFromAddress());
                if (function != null) addresses.add(function.getEntryPoint().toString());
            }
        }
        if (addresses.isEmpty()) throw new IllegalStateException("No containing functions found");
        List<String> exportArgs = new ArrayList<>();
        exportArgs.add(args[0]);
        exportArgs.addAll(addresses);
        runScript("ExportFunctions.java", exportArgs.toArray(new String[0]));
    }
}
