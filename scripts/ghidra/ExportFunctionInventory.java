import ghidra.app.util.headless.HeadlessScript;
import ghidra.framework.Application;
import ghidra.framework.options.Options;
import ghidra.program.model.address.Address;
import ghidra.program.model.listing.FunctionIterator;
import ghidra.program.model.listing.Program;
import ghidra.program.model.mem.MemoryBlock;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.TreeMap;

public class ExportFunctionInventory extends HeadlessScript {
    private record Section(String name, Address start, int length) {
        boolean has(Address address) {
            return start.getAddressSpace().equals(address.getAddressSpace())
                && address.compareTo(start) >= 0 && address.subtract(start) < length;
        }
    }

    private static String hex(byte[] bytes) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }

    private static String b64(String value) {
        return Base64.getEncoder().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private static String address(long value) {
        if (value < 0 || value > 0xffffffffL) throw new IllegalArgumentException("Not a PE32 address: " + value);
        return String.format(Locale.ROOT, "%08x", value);
    }

    @Override
    public void run() throws Exception {
        String[] args = getScriptArgs();
        if (args.length != 2) throw new IllegalArgumentException("Output directory and pinned Ghidra version required");
        // Headless analysis can still invoke this script after its per-file timeout.
        if (analysisTimeoutOccurred()) throw new IllegalStateException("Original image analysis timed out; no inventory emitted");
        if (!Application.getApplicationVersion().equals(args[1])) throw new IllegalStateException("Wrong Ghidra version");
        Path output = Path.of(args[0]);
        if (!Files.isDirectory(output)) throw new IllegalArgumentException("Existing private output directory required");
        if (Files.exists(output.resolve("complete.txt")) || Files.exists(output.resolve("inventory.tsv")))
            throw new IllegalStateException("Fresh unseen inventory output required");

        // Verify the actual loaded bytes rather than a mutable project hash property.
        Path repo = Path.of(getSourceFile().getParentFile().getParentFile().getParentFile().getAbsolutePath());
        Path sectionsPath = repo.resolve("decomp/sections.tsv");
        ArrayList<Section> sections = new ArrayList<>();
        for (String line : Files.readAllLines(sectionsPath, StandardCharsets.UTF_8)) {
            monitor.checkCancelled();
            String[] row = line.split("\\t", -1);
            if (row.length != 4) throw new IllegalStateException("Malformed section pin");
            Address start = toAddr(row[0]);
            byte[] bytes = new byte[Integer.parseInt(row[1])];
            if (currentProgram.getMemory().getBytes(start, bytes) != bytes.length || !hex(bytes).equals(row[2]))
                throw new IllegalStateException("Wrong program bytes in section " + row[3]);
            sections.add(new Section(row[3], start, bytes.length));
        }
        if (sections.isEmpty()) throw new IllegalStateException("No verified sections");

        Address base = currentProgram.getImageBase();
        var functions = currentProgram.getFunctionManager();
        TreeMap<Long, String> entries = new TreeMap<>();
        int excluded = 0;
        for (FunctionIterator it = functions.getFunctions(true); it.hasNext();) {
            monitor.checkCancelled();
            var function = it.next();
            if (function.isExternal()) throw new IllegalStateException("Internal iterator returned an external function");
            Address entry = function.getEntryPoint();
            MemoryBlock block = currentProgram.getMemory().getBlock(entry);
            Section section = sections.stream().filter(s -> s.has(entry)).findFirst().orElse(null);
            if (!base.getAddressSpace().equals(entry.getAddressSpace()) || entry.compareTo(base) < 0
                || block == null || !block.isExecute() || section == null) {
                excluded++;
                continue;
            }
            long absolute = entry.getOffset();
            String row = "entry\t" + address(absolute) + "\t" + address(entry.subtract(base))
                + "\t" + (function.isThunk() ? "thunk" : "routine") + "\t" + b64(section.name());
            if (entries.put(absolute, row) != null) throw new IllegalStateException("Duplicate entry point");
        }
        int external = 0;
        for (FunctionIterator it = functions.getExternalFunctions(); it.hasNext();) {
            monitor.checkCancelled();
            if (!it.next().isExternal()) throw new IllegalStateException("External iterator returned an internal function");
            external++;
        }

        Options options = currentProgram.getOptions(Program.ANALYSIS_PROPERTIES);
        TreeMap<String, String> values = new TreeMap<>();
        for (String name : options.getOptionNames()) {
            monitor.checkCancelled();
            String value = options.getValueAsString(name);
            if (value == null) throw new IllegalStateException("Cannot record analyzer option " + name);
            values.put(name, value);
        }

        StringBuilder out = new StringBuilder("pnd-ghidra-function-inventory\t1\n");
        out.append("ghidra\t").append(Application.getApplicationVersion()).append('\n');
        out.append("language\t").append(b64(currentProgram.getLanguageID().getIdAsString())).append('\n');
        out.append("compiler\t").append(b64(currentProgram.getCompilerSpec().getCompilerSpecID().getIdAsString())).append('\n');
        out.append("imageBase\t").append(address(base.getOffset())).append('\n');
        out.append("external\t").append(external).append('\n');
        out.append("nonInventoryInternal\t").append(excluded).append('\n');
        for (var pair : values.entrySet())
            out.append("option\t").append(b64(pair.getKey())).append('\t').append(b64(pair.getValue())).append('\n');
        for (String row : entries.values()) out.append(row).append('\n');
        monitor.checkCancelled();
        byte[] bytes = out.toString().getBytes(StandardCharsets.UTF_8);
        Files.write(output.resolve("inventory.tsv"), bytes);
        // A canceled/failing script does not leave a success marker; the Python caller requires it.
        Files.writeString(output.resolve("complete.txt"), hex(bytes) + "\n", StandardCharsets.UTF_8);
    }
}
