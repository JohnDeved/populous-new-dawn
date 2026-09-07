import java.nio.file.*;
import java.security.MessageDigest;
import java.util.HexFormat;
import ghidra.framework.Application;
import ghidra.app.script.GhidraScript;
import ghidra.app.decompiler.*;
import ghidra.program.model.listing.*;

public class ExportFunctions extends GhidraScript {
    public void run() throws Exception {
        String[] args = getScriptArgs();
        if (args.length < 2) throw new IllegalArgumentException("Output directory and entry addresses required");
        Path output = Path.of(args[0]);
        Files.createDirectories(output);
        Files.deleteIfExists(output.resolve("complete.txt"));
        // XML can overwrite the program's hash property. Verify the actual loaded section bytes.
        Path sections = Path.of(getSourceFile().getParentFile().getParentFile().getParentFile().getAbsolutePath()).resolve("decomp/sections.tsv");
        for (String line : Files.readAllLines(sections)) {
            String[] section = line.split("\t");
            byte[] bytes = new byte[Integer.parseInt(section[1])];
            if (currentProgram.getMemory().getBytes(toAddr(section[0]), bytes) != bytes.length ||
                !HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)).equals(section[2]))
                throw new IllegalStateException("Wrong program bytes in section " + section[3]);
        }
        DecompInterface decompiler = new DecompInterface();
        try {
            if (!decompiler.openProgram(currentProgram)) throw new IllegalStateException(decompiler.getLastMessage());
            for (int i = 1; i < args.length; i++) {
                if (!args[i].matches("[0-9a-fA-F]{8}")) throw new IllegalArgumentException("Invalid address");
                Function function = getFunctionAt(toAddr(args[i]));
                if (function == null) { disassemble(toAddr(args[i])); function = createFunction(toAddr(args[i]), null); }
                if (function == null) throw new IllegalStateException("Missing function " + args[i]);
                DecompileResults result = decompiler.decompileFunction(function, 90, monitor);
                if (!result.decompileCompleted()) throw new IllegalStateException(result.getErrorMessage());
                String provenance = "/* Ghidra " + Application.getApplicationVersion() + " pseudocode; entry " + args[i] + "; " + function.getName() +
                    ".\n * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */\n\n";
                Files.writeString(output.resolve(args[i].toLowerCase() + ".c"), provenance + result.getDecompiledFunction().getC().replaceAll("(?m)[ \\t]+$", "").stripTrailing() + "\n");
                println("Exported " + args[i] + " " + function.getName());
            }
            Files.writeString(output.resolve("complete.txt"), "Verified original section bytes; export complete");
        } finally { decompiler.dispose(); }
    }
}
