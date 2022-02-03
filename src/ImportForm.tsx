import React, { useState } from 'react'
import { observer } from 'mobx-react'
import AssemblySelector from '@jbrowse/core/ui/AssemblySelector'
import { FileSelector } from '@jbrowse/core/ui'
import { getSession } from '@jbrowse/core/util'
import {
  Button,
  Container,
  Checkbox,
  Grid,
  FormControlLabel,
  TextField,
  MenuItem,
  Divider,
  Typography,
  makeStyles,
} from '@material-ui/core'
import { regions } from './util'

import { generateAnnotations } from './AnnotationsAdapter'

const useStyles = makeStyles(theme => ({
  importFormContainer: {
    padding: theme.spacing(2),
  },
  button: {
    margin: theme.spacing(2),
  },
  importFormEntry: {
    minWidth: 180,
  },
  closeButton: {
    position: 'absolute',
    right: '4px',
    top: '4px',
  },
}))

const RegionSelector = observer(
  ({
    onChange,
    selected,
  }: {
    onChange: (arg: string) => void
    selected: string | undefined
  }) => {
    const classes = useStyles()
    const error = regions.length ? '' : 'No configured regions'
    return (
      <TextField
        select
        label="Region"
        variant="outlined"
        margin="normal"
        helperText={error || 'Select a region to view'}
        value={error ? '' : selected}
        inputProps={{ 'data-testid': 'region-selector' }}
        onChange={event => onChange(event.target.value)}
        error={!!error}
        disabled={!!error}
        className={classes.importFormEntry}
      >
        {regions.map(name => {
          return (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          )
        })}
      </TextField>
    )
  },
)

/**
 * Most layout and logic retrieved from the '@jbrowse/plugin/linear-genome-view/../ImportForm.tsx' component and modified for
 * the purposes of this component
 */
const ImportForm = observer(({ model }: { model: any }) => {
  const classes = useStyles()
  const session = getSession(model)
  const { assemblyNames } = session
  const [selectedAsm, setSelectedAsm] = useState(assemblyNames[0])
  const [selectedRegion, setSelectedRegion] = useState(regions[0])
  const [checked, setChecked] = useState(model.withReactome)

  async function populateAnnotations() {
    if (model.annotationsLocation) {
      model.setShowLoading(true)
      const { widget, ideo, pathways, res } = await generateAnnotations(
        model.annotationsLocation,
        model.withReactome,
      )

      if (res.type != 2) {
        model.setWidgetAnnotations(widget)
        model.setIdeoAnnotations(ideo)
      }

      if (model.withReactome) {
        session.addView('IdeogramView', {})
        const xView = session.views.length - 1
        // @ts-ignore
        session.views[xView].setDisplayName('Reactome Analysis Results')
        // @ts-ignore
        session.views[xView].setPathways(pathways)
        // @ts-ignore
        session.views[xView].setIsAnalysisResults(true)
      }

      if (!res.success) {
        session.notify(res.message, 'warning')
      }
    }
  }

  async function handleOpen(assembly: string, region: string) {
    model.setAssembly(assembly)
    model.setRegion(region)
    model.setOrientation('horizontal')
    model.setAllRegions(false)
    model.setShowImportForm(false)
    await populateAnnotations()
    model.setShowLoading(false)
  }

  async function handleOpenAllRegions(assembly: string) {
    model.setAllRegions(true)
    model.setAssembly(assembly)
    await populateAnnotations()
    model.setShowImportForm(false)
    model.setShowLoading(false)
  }

  const handleReactomeAnalysis = (event: any) => {
    setChecked(event?.target.checked)
    model.setWithReactome(event?.target.checked)
  }

  return (
    <div>
      <Container className={classes.importFormContainer}>
        <Grid container spacing={1} justifyContent="center" alignItems="center">
          <Grid item>
            <AssemblySelector
              onChange={val => {
                setSelectedAsm(val)
              }}
              session={session}
              selected={selectedAsm}
            />
          </Grid>
          <Grid item>
            <RegionSelector
              onChange={val => {
                setSelectedRegion(val)
              }}
              selected={selectedRegion}
            />
          </Grid>
          <Grid item>
            <Button
              type="submit"
              disabled={!selectedRegion}
              className={classes.button}
              onClick={() => {
                if (selectedRegion) {
                  handleOpen(selectedAsm, selectedRegion)
                }
              }}
              variant="contained"
              color="primary"
            >
              Open
            </Button>
            <Button
              disabled={!selectedRegion}
              className={classes.button}
              onClick={() => {
                handleOpenAllRegions(selectedAsm)
              }}
              variant="contained"
              color="secondary"
            >
              Show all regions in assembly
            </Button>
          </Grid>
        </Grid>
      </Container>
      <Divider></Divider>
      <Container className={classes.importFormContainer}>
        <Grid
          container
          spacing={1}
          justifyContent="center"
          alignItems="center"
          direction="column"
        >
          <Typography variant="body2">
            <b>Optional:</b> provide a .tsv file of gene annotations for the
            ideogram.
          </Typography>
          <Grid item>
            <FileSelector
              name="Annotations file"
              location={model.annotationsLocation}
              setLocation={loc => model.setAnnotationsLocation(loc)}
            />
          </Grid>
          <Grid item>
            <FormControlLabel
              label="Analyze annotations with Reactome"
              control={
                <Checkbox
                  checked={checked}
                  color="primary"
                  onChange={handleReactomeAnalysis}
                />
              }
            />
          </Grid>
        </Grid>
      </Container>
    </div>
  )
})

export default ImportForm
