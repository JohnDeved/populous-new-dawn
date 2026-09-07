import java.io.File;
import java.nio.file.*;
import ghidra.app.script.GhidraScript;
import ghidra.app.util.xml.*;

// Ghidra 12 adapter: add names/types/comments, retain the user executable's bytes.
public class ImportMetadata extends GhidraScript {
    public void run() throws Exception {
        if (getScriptArgs().length < 1 || getScriptArgs().length > 2)
            throw new IllegalArgumentException("Metadata XML path and optional completion receipt required");
        Path receipt = getScriptArgs().length == 2 ? Path.of(getScriptArgs()[1]) : null;
        if (receipt != null) Files.deleteIfExists(receipt);
        XmlProgramOptions options = new XmlProgramOptions();
        options.setAddToProgram(true);
        options.setMemoryBlocks(false);
        options.setMemoryContents(false);
        options.setProperties(false); // Preserve executable identity and local analysis settings.
        println(new ProgramXmlMgr(new File(getScriptArgs()[0])).read(currentProgram, monitor, options).toString());
        if (receipt != null) Files.writeString(receipt, "Metadata reader completed; review logged annotation conflicts");
    }
}
