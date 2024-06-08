import { useContext } from 'react';
import { Button, Table, TableBody, TableCell, TableRow } from '@mui/material';
import { DataContext } from '../context';
import { FILE_EXTN } from '../helpers';

export const OtherPatchFiles: React.FC = () => {
  const data = useContext(DataContext);

  return (
    <article style={{ margin: 16 }}>
      This page contains any other{' '}
      <a
        href="https://github.com/osm-nz/linz-address-import/blob/main/SPEC.md"
        target="_blank"
        rel="noreferrer"
      >
        osmPatch files
      </a>{' '}
      generated by the conflation process. You can use import this data using
      any editor that supports <code>{FILE_EXTN}</code> files.
      <br />
      <br />
      <Table>
        <TableBody>
          {Object.entries(data.__hack__.childPatchFiles).map(
            ([fileName, fileContents]) => (
              <TableRow key={fileName}>
                <TableCell>
                  <strong>{fileName}</strong>
                </TableCell>
                <TableCell>{fileContents.features.length} Features</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    component="a"
                    download={fileName + FILE_EXTN}
                    href={URL.createObjectURL(
                      new Blob([JSON.stringify(fileContents, null, 2)], {
                        type: 'text/json',
                      }),
                    )}
                    disabled={!fileContents.features.length}
                  >
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ),
          )}
        </TableBody>
      </Table>
    </article>
  );
};